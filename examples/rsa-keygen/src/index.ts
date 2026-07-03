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
  DEFAULT_LICENSE_PRODUCT_CONFIG,
  type LicenseProductConfig,
  type SignResult,
} from './lib/license.js';
export {
  PRODUCTS,
  DEFAULT_PRODUCT_KEY,
  resolveProduct,
  type Product,
} from './lib/products.js';
export { DEFAULT_KEYS_DIR, keyFilePaths, resolveKeysDir } from './lib/paths.js';
