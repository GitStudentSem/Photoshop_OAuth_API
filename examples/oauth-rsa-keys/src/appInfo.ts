import { generateDeviceId } from './generateDeviceId';
import type { LicenseProductConfig } from './rsa';

/**
 * Per-product license configuration.
 *
 * `installationIdPrefix` (server `keyprefix`) and `licenseHashSalt`
 * (server `keysalt`) must match the server product record. For a different
 * product replace these values (e.g. Waveform: prefix `R4WF`, salt `waveform`).
 */
export const productConfig: LicenseProductConfig = {
  installationIdPrefix: 'R4VS',
  licenseHashSalt: '',
};

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
    _installationId = `${productConfig.installationIdPrefix}-${_deviceId}`;
  }
};

export const publicKey = `-----BEGIN RSA-256 PUBLIC KEY-----
460ab8d5564691af4e06075a83ad0536a3375275c783e1044c398e76ccb762f1
10001
-----END RSA-256 PUBLIC KEY-----`;
