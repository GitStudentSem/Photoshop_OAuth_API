export { generateKeyPair, modPow, type RsaKeyPair } from './lib/rsa256.js';
export {
  bufferToNiobiumString,
  stringNiobiumToBuffer,
} from './lib/niobium.js';
export {
  formatAppPublicKeySnippet,
  formatPrivateKeyPem,
  formatPublicKeyPem,
  parsePrivateKeyPem,
  parsePublicKeyPem,
  readPrivateKeyFile,
  readPublicKeyFile,
  saveKeyPair,
  type PrivateKeyComponents,
  type PublicKeyComponents,
  type SavedKeyPaths,
} from './lib/pem.js';
export {
  createHash256,
  normalizeInstallationId,
  signLicenseKey,
  verifyLicenseKey,
  type SignResult,
} from './lib/license.js';
export { DEFAULT_KEYS_DIR, keyFilePaths, resolveKeysDir } from './lib/paths.js';
