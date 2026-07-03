import CryptoJS from 'crypto-js';
import { shell } from 'uxp';
import os from 'os';
import OAuthAPI, { OAuthAPIError } from '@relu-ps/oauth-api';
import UserStore from './UserStore';
import { appInfo, initAppInfo, productConfig, publicKey } from './appInfo';
import { ClientError } from './ClientError';
import { verifyLicenseKey } from './rsa';

export const PROGRAM_NAME = 'retouch4me_vectorscope_panel';

export const oauth = new OAuthAPI();

const FILE_NAME = 'auth';

const storageNames = {
  accessTokenType: 'accessTokenType',
  accessToken: 'accessToken',
};

let pullingTimer: ReturnType<typeof setInterval> | null = null;

const checkInternetConnection = (actionName: string): boolean => {
  const isOnline = navigator.onLine;
  if (!isOnline) {
    console.error(`${actionName} failed. Check your internet connection`);
  }
  return isOnline;
};

/**
 * Vectorscope uses its own client_id; npm package defaults to retouch4me_photoshop_panel.
 */
export const getAuthLink = (
  deviceId: string,
  codeVerifier: string,
  codeChallenge: string,
): string => {
  const responseType = 'code';
  const scope = 'profile';
  const codeChallengeMethod = 'S256';

  return `${oauth.authorizeLink}?response_type=${responseType}&client_id=${PROGRAM_NAME}&redirect_uri=${encodeURIComponent(oauth.redirectLink)}&scope=${scope}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}&code_verifier=${codeVerifier}&deviceid=${deviceId}`;
};

const verifyStoredLicenseKey = (): boolean => {
  if (!UserStore.isAuth || !UserStore.licenseKey) {
    return false;
  }

  return verifyLicenseKey(
    UserStore.userEmail,
    appInfo.installationId,
    UserStore.licenseKey,
    publicKey,
    productConfig,
  );
};

export const validateSavedSession = async (): Promise<boolean> => {
  await initAppInfo();

  if (!UserStore.isAuth || !UserStore.licenseKey) {
    return false;
  }

  const isValid = verifyStoredLicenseKey();
  if (!isValid) {
    UserStore.logout();
  }

  return isValid;
};

const getToken = async (codeVerifier: string): Promise<void> => {
  const methodName = 'getToken';

  await new Promise<void>((resolve, reject) => {
    let limit = 0;

    if (pullingTimer) {
      clearInterval(pullingTimer);
      pullingTimer = null;
    }

    pullingTimer = setInterval(async () => {
      limit += 1;

      if (limit >= 20) {
        clearInterval(pullingTimer!);
        pullingTimer = null;
        reject(
          new ClientError(
            'Too much time has passed trying to Login, please try again.',
            FILE_NAME,
            methodName,
          ),
        );
        return;
      }

      try {
        const token = await oauth.getToken(codeVerifier);

        clearInterval(pullingTimer!);
        pullingTimer = null;

        localStorage.setItem(storageNames.accessTokenType, token.token_type);
        localStorage.setItem(storageNames.accessToken, token.access_token);

        await getProfile(token.token_type, token.access_token);
        resolve();
      } catch (error) {
        if (error instanceof OAuthAPIError && error.isAuthPending) {
          return;
        }

        clearInterval(pullingTimer!);
        pullingTimer = null;
        reject(error);
      }
    }, 3000);
  });
};

const getProfile = async (tokenType: string, accessToken: string): Promise<void> => {
  const profile = await oauth.getProfile(tokenType, accessToken);
  UserStore.login(profile.mail, profile.name);
  await getLicenceKey();
};

export const getLicenceKey = async (): Promise<void> => {
  const methodName = 'getLicenceKey';
  const hasInternet = checkInternetConnection('Get license key');
  if (!hasInternet) {
    throw new ClientError('No internet connection', FILE_NAME, methodName);
  }

  if (!UserStore.isAuth) {
    throw new ClientError('Login for get key', FILE_NAME, methodName);
  }

  const generateSession = () => {
    const accessToken = `${localStorage.getItem(storageNames.accessToken)}${appInfo.installationId}`;
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
    throw new ClientError('Email was not found.', FILE_NAME, methodName);
  }

  const licenceInfo = await oauth.getOnlineRegistrationKey({
    email,
    programName: PROGRAM_NAME,
    deviceId: appInfo.deviceId,
    installationId: appInfo.installationId,
    session: generateSession(),
    withkey: true,
    subscription: false,
    platform: os.platform(),
    onLogout: () => {
      UserStore.logout();
    },
  });

  const licenseKey = licenceInfo.key || '';
  if (!licenseKey) {
    throw new ClientError('License key was not found', FILE_NAME, methodName);
  }

  const isValid = verifyLicenseKey(
    email,
    appInfo.installationId,
    licenseKey,
    publicKey,
    productConfig,
  );

  if (!isValid) {
    UserStore.logout();
    throw new ClientError('Invalid license key', FILE_NAME, methodName);
  }

  UserStore.setLicenseKey(licenseKey);
};

export const onAuth = async (): Promise<void> => {
  await initAppInfo();

  const codeVerifier = CryptoJS.lib.WordArray.random(50).toString();
  const codeChallenge = CryptoJS.SHA256(codeVerifier)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const link = getAuthLink(appInfo.deviceId, codeVerifier, codeChallenge);

  await shell.openExternal(link, 'Open browser for login');
  await getToken(codeVerifier);
};
