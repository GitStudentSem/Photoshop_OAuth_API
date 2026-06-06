import CryptoJS from "crypto-js";
import { shell } from "uxp";
import OauthAPI from "@relu-ps/oauth-api";
import UserStore from "./UserStore";



const catchError = (
    userMessage: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    error: Error | any,
    methodName: string,
    fileName: string,
  ) => {
    console.error({
      userMessage,
      error: {
        message: error.message,
        methodName: methodName,
        fileName: fileName,
      },
    });
  }

  const checkInternetConnection = (actionName: string) => {
    const isOnline = navigator.onLine;
    if (!isOnline) {
      console.error({
        userMessage: `${actionName} failed. Check your internet connection`,
      });
    }
  
    return isOnline;
  };

export const oauth: OauthAPI = new OauthAPI((type, error, isShowLog) =>
  console.error(error, isShowLog),
);
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
        reject(new Error("Too much time has passed trying to Login, please try again."));
        return;
      }

      try {
        const token = await oauth.getToken(codeVerifier);

        if (token.failed === false) {
          clearInterval(pullingTimer!);
          pullingTimer = undefined;

          localStorage.setItem("accessTokenType", token.data.token_type);
          localStorage.setItem("accessToken", token.data.access_token);

          await getProfile(token.data.token_type, token.data.access_token);
          resolve(); // весь flow завершён — снаружи можно await'ить
          return;
        }

        // 404 — пользователь ещё не залогинился, продолжаем polling
        if (token.data.status === 404) return;

        clearInterval(pullingTimer!);
        pullingTimer = undefined;
        reject(token.data);
      } catch (error) {
        clearInterval(pullingTimer!);
        pullingTimer = undefined;
        reject(error);
      }
    }, 3000);
  });
};

const getProfile = async (tokenType: string, accessToken: string): Promise<void> => {
  const profile = await oauth.getProfile(tokenType, accessToken);

  if (profile.failed === false) {
    UserStore.login(profile.data.mail, profile.data.name);
    await getRetouchToken();
    return;
  }

  console.error({
    userMessage: "Receiving profile failed",
    error: profile.data,
  });
  throw profile.data; // пробрасываем вверх → getToken сделает reject
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

  if (!email || email === "null" || email === "undefined" || email === "false") {
    UserStore.logout();
    throw new Error("Email was not found.");
  }

  const tokenData = await oauth.getRetouchToken(
    email,
    generateSession(),
    localStorage.getItem("deviceid") || "",
    "retouch4me_photoshop_panel",
  );

  if (tokenData.failed === false) {
    UserStore.setRemainingRetouch(tokenData.data.remaining.professional);
    localStorage.setItem("retouchToken", tokenData.data.token);
    return;
  }

  if (tokenData.data.status === 401) {
    UserStore.logout();
  }

  console.error({
    userMessage: "Receiving retouch token failed",
    error: tokenData.data,
  });
  throw tokenData.data;
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

  const link = oauth.getLink(deviceid, codeVerifier, codeChallenge);

  await shell.openExternal(link, "Open browser for login");
  await getToken(codeVerifier); // теперь реально ждёт до конца
};

const setUserInfo = () => {
  const { isAuth, userEmail, userName, remainingRetouch } = UserStore;

  if (isAuth) {
    document.getElementById("userEmail")!.textContent = `Email: ${userEmail}`;
    document.getElementById("userName")!.textContent = `User Name: ${userName}`;
    document.getElementById("remainingRetouch")!.textContent =
      `remaining retouches: ${remainingRetouch}`;
  } else {
    document.getElementById("userEmail")!.textContent = "Email:";
    document.getElementById("userName")!.textContent = "User Name:";
    document.getElementById("remainingRetouch")!.textContent =
      "remaining retouches: 0";
  }
};

async function onAuthorizeClick(): Promise<void> {
  try {
    await onAuth();
    setUserInfo(); // вызывается только после успешного логина
  } catch (error) {
    catchError("Authorisation failed", error, "onAuthorizeClick", FILE_NAME);
    setUserInfo(); // на случай logout внутри flow
  }
}

setUserInfo();
document.getElementById("authorize")?.addEventListener("click", onAuthorizeClick);

document.getElementById("logout")?.addEventListener("click", ()=>{UserStore.logout();setUserInfo();});