import CryptoJS from 'crypto-js';
import { shell } from 'uxp';
import OAuthAPI from '@relu-ps/oauth-api';
import UserStore from './UserStore.js';
import { appInfo, initAppInfo } from './appInfo.js';

const catchError = (userMessage, error, methodName, fileName) => {
  console.error({
    userMessage,
    error: {
      message: error?.message,
      methodName,
      fileName,
    },
  });
};

const checkInternetConnection = (actionName) => {
  const isOnline = navigator.onLine;
  if (!isOnline) {
    console.error({
      userMessage: `${actionName} failed. Check your internet connection`,
    });
  }

  return isOnline;
};

export const oauth = new OAuthAPI((type, error, isShowLog) =>
  console.error(error, isShowLog),
);

const FILE_NAME = 'auth';

let pullingTimer;

const getToken = (codeVerifier) => {
  return new Promise((resolve, reject) => {
    let limit = 0;

    if (pullingTimer) clearInterval(pullingTimer);

    pullingTimer = setInterval(async () => {
      limit += 1;

      if (limit >= 20) {
        clearInterval(pullingTimer);
        pullingTimer = undefined;
        reject(
          new Error(
            'Too much time has passed trying to Login, please try again.',
          ),
        );
        return;
      }

      try {
        const token = await oauth.getToken(codeVerifier);

        if (token.failed === false) {
          clearInterval(pullingTimer);
          pullingTimer = undefined;

          localStorage.setItem('accessTokenType', token.data.token_type);
          localStorage.setItem('accessToken', token.data.access_token);

          await getProfile(token.data.token_type, token.data.access_token);
          resolve();
          return;
        }

        // 404 — пользователь ещё не залогинился, продолжаем polling
        if (token.data.status === 404) return;

        clearInterval(pullingTimer);
        pullingTimer = undefined;
        reject(token.data);
      } catch (error) {
        clearInterval(pullingTimer);
        pullingTimer = undefined;
        reject(error);
      }
    }, 3000);
  });
};

const getProfile = async (tokenType, accessToken) => {
  const profile = await oauth.getProfile(tokenType, accessToken);

  if (profile.failed === false) {
    UserStore.login(profile.data.mail, profile.data.name);
    await getLicenceKey();
    return;
  }

  console.error({
    userMessage: 'Receiving profile failed',
    error: profile.data,
  });
  throw profile.data;
};

export const getLicenceKey = async () => {
  const hasInternet = checkInternetConnection('Get license key');
  if (!hasInternet) throw new Error('No internet connection');

  if (!UserStore.isAuth) {
    throw new Error('Login for get key');
  }

  const generateSession = () => {
    const accessToken = `${localStorage.getItem('accessToken')}${appInfo.installationId}`;
    const onlineLUTStorageHMACKey =
      'uizcmdZk0bCJYqPYREw9r2GYPups4IhGMc4mSeCgrv2S74lsYd+W3TQaTW+XDbkZ0B/rzy4+8foTLyGWU9SQJA';
    const hmac = CryptoJS.HmacSHA512(accessToken, onlineLUTStorageHMACKey);
    return hmac.toString(CryptoJS.enc.Hex).toUpperCase();
  };

  const email = UserStore.userEmail;

  if (
    !email ||
    email === 'null' ||
    email === 'undefined' ||
    email === 'false'
  ) {
    UserStore.logout();
    throw new Error('Email was not found.');
  }

  const licenceInfo = await oauth.getOnlineRegistrationKey({
    email,
    programName: 'retouch4me_vectorscope_panel',
    deviceId: appInfo.deviceId,
    installationId: appInfo.installationId,
    session: generateSession(),
    withkey: true,
    subscription: false,
    onLogout: () => {
      UserStore.logout();
    },
  });

  UserStore.setLicenseKey(licenceInfo.key || '');
};

export const onAuth = async () => {
  await initAppInfo();

  const codeVerifier = CryptoJS.lib.WordArray.random(50).toString();
  const codeChallenge = CryptoJS.SHA256(codeVerifier)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const link = oauth.getLink(appInfo.deviceId, codeVerifier, codeChallenge);

  await shell.openExternal(link, 'Open browser for login');
  await getToken(codeVerifier);
};

const setUserInfo = () => {
  const { isAuth, userEmail, userName, licenseKey } = UserStore;

  if (isAuth) {
    document.getElementById('userEmail').textContent = `Email: ${userEmail}`;
    document.getElementById('userName').textContent = `User Name: ${userName}`;
    document.getElementById('licenseKey').textContent = licenseKey
      ? 'License key: [received]'
      : 'License key: [empty]';
  } else {
    document.getElementById('userEmail').textContent = 'Email:';
    document.getElementById('userName').textContent = 'User Name:';
    document.getElementById('licenseKey').textContent = 'License key:';
  }
};

async function onAuthorizeClick() {
  try {
    await onAuth();
    setUserInfo();
  } catch (error) {
    catchError('Authorisation failed', error, 'onAuthorizeClick', FILE_NAME);
    setUserInfo();
  }
}

setUserInfo();
document.getElementById('authorize')?.addEventListener('click', onAuthorizeClick);
document.getElementById('logout')?.addEventListener('click', () => {
  UserStore.logout();
  setUserInfo();
});
