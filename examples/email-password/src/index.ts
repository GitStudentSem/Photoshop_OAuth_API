import CryptoJS from "crypto-js";
import OauthAPI, { OAuthAPIError } from "@relu-ps/oauth-api";
import { initServerSelect } from "../../shared/oauthStaticServers";
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

const APPLICATION = "retouch4me_photoshop_panel";

const ONLINE_LUT_STORAGE_HMAC_KEY =
  "uizcmdZk0bCJYqPYREw9r2GYPups4IhGMc4mSeCgrv2S74lsYd+W3TQaTW+XDbkZ0B/rzy4+8foTLyGWU9SQJA";
const RETOUCH_HASH_PARAM = "retouchtoken";

const ensureDeviceId = (): string => {
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

  return deviceid;
};

const generateRetouchSession = (session: string): string => {
  const hasher = CryptoJS.algo.HMAC.create(
    CryptoJS.algo.SHA512,
    ONLINE_LUT_STORAGE_HMAC_KEY,
  );
  const stringToHash = session + RETOUCH_HASH_PARAM;
  const hash = hasher.finalize(stringToHash);
  return hash.toString(CryptoJS.enc.Hex);
};

const setEmailPasswordAuth = (session: string) => {
  localStorage.setItem("authSession", session);
};

export const getRetouchToken = async (): Promise<void> => {
  const hasInternet = checkInternetConnection("Get retouch tokens");
  if (!hasInternet) throw new Error("No internet connection");

  if (!UserStore.isAuth) {
    throw new Error("Login for refresh retouches");
  }

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

  const authSession = localStorage.getItem("authSession");
  if (!authSession) {
    throw new Error("Session was not found. Please login again.");
  }

  try {
    const tokenData = await oauth.getRetouchToken(
      email,
      generateRetouchSession(authSession),
      localStorage.getItem("deviceid") || "",
      APPLICATION,
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

export const loginViaEmailPassword = async (
  email: string,
  password: string,
): Promise<void> => {
  const deviceid = ensureDeviceId();
  const result = await oauth.loginViaEmailPassword({
    email,
    password,
    deviceid,
    application: APPLICATION,
  });

  setEmailPasswordAuth(result.session);
  UserStore.login(result.mail, `${result.firstname} ${result.lastname}`);

  await getRetouchToken();
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

const getInputValue = (id: string): string => {
  const element = document.getElementById(id) as HTMLInputElement | null;
  return element?.value?.trim() ?? "";
};

async function onLoginClick(): Promise<void> {
  try {
    const email = getInputValue("email");
    const password = getInputValue("password");

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    await loginViaEmailPassword(email, password);
    setUserInfo();
  } catch (error) {
    catchError("Login failed", error, "onLoginClick", FILE_NAME);
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
document.getElementById("login")?.addEventListener("click", onLoginClick);
document.getElementById("logout")?.addEventListener("click", () => {
  UserStore.logout();
  setUserInfo();
});
