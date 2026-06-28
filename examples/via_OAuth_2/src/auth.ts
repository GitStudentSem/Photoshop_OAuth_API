import CryptoJS from 'crypto-js';
import { shell } from 'uxp';
import os from 'os';
import OAuthAPI from '@relu-ps/oauth-api';
import UserStore from './UserStore';
import { appInfo, initAppInfo, publicKey } from './appInfo';
import { ClientError } from './ClientError';
import { verifyLicenseKey } from './rsa';

export const PROGRAM_NAME = 'retouch4me_vectorscope_panel';

export const oauth = new OAuthAPI((type, error, isShowLog) => {
  if (isShowLog) {
    console.error(error);
  }
});

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
    let finished = false;

    const finish = ({ ok, error }: { ok: boolean; error?: unknown }) => {
      if (finished) return;
      finished = true;

      if (pullingTimer) {
        clearInterval(pullingTimer);
        pullingTimer = null;
      }

      if (ok) {
        resolve();
        return;
      }

      if (error instanceof ClientError) {
        reject(error);
        return;
      }

      if (error instanceof Error) {
        reject(new ClientError(error.message, FILE_NAME, methodName));
        return;
      }

      reject(new ClientError('Auth failed', FILE_NAME, methodName));
    };

    let limit = 0;

    if (pullingTimer) {
      clearInterval(pullingTimer);
      pullingTimer = null;
    }

    pullingTimer = setInterval(async () => {
      try {
        limit += 1;

        if (limit >= 20) {
          finish({
            ok: false,
            error: new ClientError(
              'Too much time has passed trying to Login, please try again.',
              FILE_NAME,
              methodName,
            ),
          });
          return;
        }

        const token = await oauth.getToken(codeVerifier);

        if (token.failed === false) {
          localStorage.setItem(storageNames.accessTokenType, token.data.token_type);
          localStorage.setItem(storageNames.accessToken, token.data.access_token);

          await getProfile(token.data.token_type, token.data.access_token);
          finish({ ok: true });
          return;
        }

        if (token.data.status === 404) {
          return;
        }

        finish({
          ok: false,
          error: new ClientError(
            `Receiving token failed: ${token.data?.message || 'Unknown error'}.`,
            FILE_NAME,
            methodName,
          ),
        });
      } catch (error) {
        finish({ ok: false, error });
      }
    }, 3000);
  });
};

const getProfile = async (tokenType: string, accessToken: string): Promise<void> => {
  const methodName = 'getProfile';
  const profile = await oauth.getProfile(tokenType, accessToken);

  if (profile.failed === false) {
    UserStore.login(profile.data.mail, profile.data.name);
    await getLicenceKey();
    return;
  }

  throw new ClientError(
    profile.data.message,
    FILE_NAME,
    profile.data.methodName || methodName,
  );
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
  );

  if (!isValid) {
    UserStore.logout();
    throw new ClientError('Invalid license key', FILE_NAME, methodName);
  }

  UserStore.setLicenseKey(licenseKey);
};

export const onAuth = async (): Promise<void> => {
  const methodName = 'onAuth';
  await initAppInfo();

  const codeVerifier = CryptoJS.lib.WordArray.random(50).toString();
  const codeChallenge = CryptoJS.SHA256(codeVerifier)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const link = getAuthLink(appInfo.deviceId, codeVerifier, codeChallenge);

  try {
    await shell.openExternal(link, 'Open browser for login');
    await getToken(codeVerifier);
  } catch (error) {
    console.error('User has blocked browser or auth failed', error);
    throw error instanceof ClientError
      ? error
      : new ClientError(
          error instanceof Error ? error.message : 'Auth failed',
          FILE_NAME,
          methodName,
        );
  }
};
