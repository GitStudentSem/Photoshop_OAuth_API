import UserStore from './UserStore';
import { onAuth, oauth, validateSavedSession } from './auth';
import { OAuthAPIError } from '@relu-ps/oauth-api';
import { ClientError } from './ClientError';
import { initServerSelect } from '../../shared/oauthStaticServers';

const FILE_NAME = 'index';

const catchError = (userMessage: string, error: unknown, methodName: string) => {
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

  const message = error instanceof Error ? error.message : String(error);
  console.error({
    userMessage,
    error: {
      message,
      methodName,
      fileName: error instanceof ClientError ? error.fileName : FILE_NAME,
    },
  });
};

const setUserInfo = (statusMessage = '') => {
  const { isAuth, userEmail, userName, licenseKey } = UserStore;
  const statusEl = document.getElementById('status');

  if (isAuth) {
    document.getElementById('userEmail')!.textContent = `Email: ${userEmail}`;
    document.getElementById('userName')!.textContent = `User Name: ${userName}`;
    document.getElementById('licenseKey')!.textContent = licenseKey
      ? 'License key: valid'
      : 'License key: [empty]';
  } else {
    document.getElementById('userEmail')!.textContent = 'Email:';
    document.getElementById('userName')!.textContent = 'User Name:';
    document.getElementById('licenseKey')!.textContent = 'License key:';
  }

  if (statusEl) {
    statusEl.textContent = statusMessage;
  }
};

async function onAuthorizeClick() {
  const authorizeBtn = document.getElementById('authorize') as HTMLButtonElement | null;
  if (authorizeBtn) {
    authorizeBtn.disabled = true;
  }

  setUserInfo('Authorizing...');

  try {
    await onAuth();
    setUserInfo('Authorization successful');
  } catch (error) {
    catchError('Authorisation failed', error, 'onAuthorizeClick');
    setUserInfo('Authorization failed');
  } finally {
    if (authorizeBtn) {
      authorizeBtn.disabled = false;
    }
  }
}

async function init() {
  try {
    const hasValidSession = await validateSavedSession();
    if (hasValidSession) {
      setUserInfo('Session restored');
      return;
    }
    setUserInfo('');
  } catch (error) {
    catchError('Session validation failed', error, 'init');
    setUserInfo('');
  }
}

initServerSelect(oauth, () => {
  if (UserStore.isAuth) {
    UserStore.logout();
    setUserInfo('Logged out');
  }
});

document.getElementById('authorize')?.addEventListener('click', onAuthorizeClick);
document.getElementById('logout')?.addEventListener('click', () => {
  UserStore.logout();
  setUserInfo('Logged out');
});

init();
