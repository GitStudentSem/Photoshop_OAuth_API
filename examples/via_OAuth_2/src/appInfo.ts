import { generateDeviceId } from './generateDeviceId';

let _deviceId = '';
let _installationId = '';

export const appInfo = {
  get deviceId() {
    return _deviceId;
  },
  get installationId() {
    return _installationId;
  },
};

export const initAppInfo = async () => {
  if (!_deviceId) {
    _deviceId = await generateDeviceId();
  }
  if (!_installationId) {
    _installationId = `R4VS-${_deviceId}`;
  }
};

export const publicKey = `-----BEGIN RSA-256 PUBLIC KEY-----
460ab8d5564691af4e06075a83ad0536a3375275c783e1044c398e76ccb762f1
10001
-----END RSA-256 PUBLIC KEY-----`;
