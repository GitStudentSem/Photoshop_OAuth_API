import CryptoJS from "crypto-js";
import { shell } from "uxp";
import OauthAPI, { OAuthAPIError } from "@relu-ps/oauth-api";
import { initServerSelect } from "../../shared/oauthStaticServers";
import { applicationName } from "./applicationName";
import UserStore from "./UserStore";

const catchError = (
  userMessage: string,
  error: unknown,
  methodName: string,
  fileName: string,
) => {
  if (error instanceof OAuthAPIError) {
    console.error({
      userMessage,
      error: {
        message: error.message,
        status: error.status,
        methodName: error.methodName,
        fileName: error.fileName,
      },
    });
    return;
  }

  if (error instanceof Error) {
    console.error({
      userMessage,
      error: {
        message: error.message,
        methodName,
        fileName,
      },
    });
    return;
  }

  console.error({ userMessage, error, methodName, fileName });
};

const checkInternetConnection = (actionName: string) => {
  const isOnline = navigator.onLine;
  if (!isOnline) {
    console.error({
      userMessage: `${actionName} failed. Check your internet connection`,
    });
  }

  return isOnline;
};

export const oauth: OauthAPI = new OauthAPI();
const FILE_NAME = "auth";

let pullingTimer: ReturnType<typeof setInterval> | undefined;

const getToken = (codeVerifier: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    let limit = 0;

    if (pullingTimer) clearInterval(pullingTimer);

    pullingTimer = setInterval(async () => {
      limit += 1;

      if (limit >= 20) {
        clearInterval(pullingTimer!);
        pullingTimer = undefined;
        reject(
          new Error(
            "Too much time has passed trying to Login, please try again.",
          ),
        );
        return;
      }

      try {
        const token = await oauth.getToken(codeVerifier);

        clearInterval(pullingTimer!);
        pullingTimer = undefined;

        localStorage.setItem("accessTokenType", token.token_type);
        localStorage.setItem("accessToken", token.access_token);

        await getProfile(token.token_type, token.access_token);
        resolve();
      } catch (error) {
        if (error instanceof OAuthAPIError && error.isAuthPending) {
          return;
        }

        clearInterval(pullingTimer!);
        pullingTimer = undefined;
        reject(error);
      }
    }, 3000);
  });
};

const getProfile = async (
  tokenType: string,
  accessToken: string,
): Promise<void> => {
  const profile = await oauth.getProfile(tokenType, accessToken);
  UserStore.login(profile.mail, profile.name);
  await getRetouchToken();
};

export const getRetouchToken = async (): Promise<void> => {
  const hasInternet = checkInternetConnection("Get retouch tokens");
  if (!hasInternet) throw new Error("No internet connection");

  if (!UserStore.isAuth) {
    throw new Error("Login for refresh retouches");
  }

  const generateSession = () => {
    const accessToken = localStorage.getItem("accessToken");
    const onlineLUTStorageHMACKey =
      "uizcmdZk0bCJYqPYREw9r2GYPups4IhGMc4mSeCgrv2S74lsYd+W3TQaTW+XDbkZ0B/rzy4+8foTLyGWU9SQJA";
    const RETOUCH_HASH_PARAM = "retouchtoken";
    const hasher = CryptoJS.algo.HMAC.create(
      CryptoJS.algo.SHA512,
      onlineLUTStorageHMACKey,
    );
    const stringToHash = accessToken + RETOUCH_HASH_PARAM;
    const hash = hasher.finalize(stringToHash);
    return hash.toString(CryptoJS.enc.Hex);
  };

  const email = localStorage.getItem("userEmail");

  if (
    !email ||
    email === "null" ||
    email === "undefined" ||
    email === "false"
  ) {
    UserStore.logout();
    throw new Error("Email was not found.");
  }

  try {
    const tokenData = await oauth.getRetouchToken(
      email,
      generateSession(),
      localStorage.getItem("deviceid") || "",
      applicationName,
    );

    UserStore.setRemainingRetouch(tokenData.remaining.professional);
    localStorage.setItem("retouchToken", tokenData.token);
  } catch (error) {
    if (error instanceof OAuthAPIError && error.status === 401) {
      UserStore.logout();
    }

    console.error({
      userMessage: "Receiving retouch token failed",
      error:
        error instanceof OAuthAPIError
          ? {
              message: error.message,
              status: error.status,
              methodName: error.methodName,
              fileName: error.fileName,
            }
          : error,
    });
    throw error;
  }
};

export const onAuth = async (): Promise<void> => {
  const generateDeviceId = (length: number) => {
    let deviceid = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      deviceid += characters.charAt(
        Math.floor(Math.random() * charactersLength),
      );
      counter += 1;
    }
    localStorage.setItem("deviceid", deviceid);
    return deviceid;
  };

  let deviceid = localStorage.getItem("deviceid");
  if (!deviceid || deviceid === "null" || deviceid === "undefined") {
    deviceid = generateDeviceId(25);
  }

  const codeVerifier = CryptoJS.lib.WordArray.random(50).toString();
  const codeChallenge = CryptoJS.SHA256(codeVerifier)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const link = oauth.getLink(
    deviceid,
    codeVerifier,
    codeChallenge,
    applicationName,
  );

  await shell.openExternal(link, "Open browser for login");
  await getToken(codeVerifier);
};

const setUserInfo = () => {
  const { isAuth, userEmail, userName, remainingRetouch } = UserStore;
  const userEmailElement = document.getElementById("userEmail");
  const userNameElement = document.getElementById("userName");
  const remainingRetouchElement = document.getElementById("remainingRetouch");

  if (!userEmailElement) {
    throw new Error("User info userEmailElement not found");
  }
  if (!userNameElement) {
    throw new Error("User info userNameElement not found");
  }
  if (!remainingRetouchElement) {
    throw new Error("User info remainingRetouchElement not found");
  }

  if (isAuth) {
    userEmailElement.textContent = `Email: ${userEmail}`;
    userNameElement.textContent = `User Name: ${userName}`;
    remainingRetouchElement.textContent = `remaining retouches: ${remainingRetouch}`;
  } else {
    userEmailElement.textContent = "Email:";
    userNameElement.textContent = "User Name:";
    remainingRetouchElement.textContent = "remaining retouches: 0";
  }
};

async function onAuthorizeClick(): Promise<void> {
  try {
    await onAuth();
    setUserInfo();
  } catch (error) {
    catchError("Authorisation failed", error, "onAuthorizeClick", FILE_NAME);
    setUserInfo();
  }
}

initServerSelect(oauth, () => {
  if (UserStore.isAuth) {
    UserStore.logout();
    setUserInfo();
  }
});

setUserInfo();
document
  .getElementById("authorize")
  ?.addEventListener("click", onAuthorizeClick);

document.getElementById("logout")?.addEventListener("click", () => {
  UserStore.logout();
  setUserInfo();
});
