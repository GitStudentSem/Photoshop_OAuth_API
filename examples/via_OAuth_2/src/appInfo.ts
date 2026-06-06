import { generateDeviceId } from '../src/utils/generateDeviceId.js';

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
