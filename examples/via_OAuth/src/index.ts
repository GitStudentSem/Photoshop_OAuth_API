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

export const onAuth = async () => {
  try {
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

      localStorage.setItem('deviceid', deviceid);
      return deviceid;
    };

    let deviceid = localStorage.getItem('deviceid');

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

    try {
      await shell.openExternal(link, "Open browser for login");

      await getToken(codeVerifier);
    } catch (error) {
    console.error(error);
    }
  } catch (error) {
    catchError("Authorisation failed", error, "onAuth", FILE_NAME);
  }
};

let pullingTimer: NodeJS.Timeout;
const getToken = async (codeVerifier: string) => {
  let limit = 0;
  // We delete the old request if a new one is launched
  if (pullingTimer) clearInterval(pullingTimer);

  pullingTimer = setInterval(async () => {
    limit += 1;
    if (limit >= 20) {
        console.error('Too much time has passed trying to Login, please try again.');

      clearInterval(pullingTimer);
      return;
    }

    try {
      const token = await oauth.getToken(codeVerifier);
      if (token.failed === false) {
        clearInterval(pullingTimer);

        localStorage.setItem(
          'accessTokenType',
          token.data.token_type,
        );
        localStorage.setItem('accessToken', token.data.access_token);
        await getProfile(token.data.token_type, token.data.access_token);
      } else {
        /**
         * there is no way to determine whether the user has refused or has not
         * yet given consent, so I ignore the 404, all other errors will
         * be shown
         */
        if (token.data.status === 404) return;

        console.error({
          userMessage: "Receiving token failed",
          error: token.data,
        });
      }
    } catch (error) {
      clearInterval(pullingTimer);
      catchError("Receiving token failed", error, "getToken", FILE_NAME);
    }
  }, 3000);
};

const getProfile = async (tokenType: string, accessToken: string) => {
  try {
    const profile = await oauth.getProfile(tokenType, accessToken);

    if (profile.failed === false) {
      UserStore.login(profile.data.mail, profile.data.name);
      await getRetouchToken();
    } else {
        console.error({
        userMessage: "Receiving profile failed",
        error: profile.data,
      });
    }
  } catch (error) {
    catchError("Receiving profile failed", error, "getProfile", FILE_NAME);
  }
};
export const getRetouchToken = async () => {
  try {
    const hasInternet = checkInternetConnection("Get retouch tokens");
    if (!hasInternet) return;

    if (!UserStore.isAuth) {
        console.error({
        userMessage: "Login for refresh retouches",
      });
      return;
    }
    const generateSession = () => {
      const accessToken = localStorage.getItem('accessToken');

      const onlineLUTStorageHMACKey =
        "uizcmdZk0bCJYqPYREw9r2GYPups4IhGMc4mSeCgrv2S74lsYd+W3TQaTW+XDbkZ0B/rzy4+8foTLyGWU9SQJA";
      const RETOUCH_HASH_PARAM = "retouchtoken";
      const hasher = CryptoJS.algo.HMAC.create(
        CryptoJS.algo.SHA512,
        onlineLUTStorageHMACKey,
      );
      const stringToHash = accessToken + RETOUCH_HASH_PARAM;
      const hash = hasher.finalize(stringToHash);
      const ns = hash.toString(CryptoJS.enc.Hex);
      return ns;
    };

    const email = localStorage.getItem('userEmail');

    if (
      !email ||
      email === "null" ||
      email === "undefined" ||
      email === "false"
    ) {
      UserStore.logout();
      throw new Error("Email was not found.");
    }

    const tokenData = await oauth.getRetouchToken(
      email,
      generateSession(),
      localStorage.getItem('deviceid') || "",
      "retouch4me_photoshop_panel",
    );

    if (tokenData.failed === false) {
      UserStore.setRemainingRetouch(tokenData.data.remaining.professional);
      localStorage.setItem('retouchToken', tokenData.data.token);
    } else {
      if (tokenData.data.status === 401) {
        UserStore.logout();
      }

      console.error({
        userMessage: "Receiving retouch token failed",
        error: tokenData.data,
      });
    }
  } catch (error) {
    catchError(
      "Receiving retouch token failed",
      error,
      "getRetouchToken",
      FILE_NAME,
    );
  }
};

const setUserInfo = () => {
  const isAuth =UserStore.isAuth
  const userEmail =UserStore.userEmail
  const userName =UserStore.userName
  const remainingRetouch =UserStore.remainingRetouch

  if(isAuth) {  
    document.getElementById("userEmail")!.textContent = `Email: ${userEmail}}`
    document.getElementById("userName")!.textContent = `User Name: ${userName}`
    document.getElementById("remainingRetouch")!.textContent = `remaining retouches: ${remainingRetouch}`
  } else {
    document.getElementById("userEmail")!.textContent = "Email:"
    document.getElementById("userName")!.textContent = "User Name:"
    document.getElementById("remainingRetouch")!.textContent = "remaining retouches: 0"
  }
}


async function showLayerNames(): Promise<void> {

await onAuth();
setUserInfo()
}
setUserInfo()
document.getElementById("authorize")?.addEventListener("click", showLayerNames);
