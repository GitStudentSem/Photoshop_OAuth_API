import crypto from 'node:crypto';
import { bufferToNiobiumString, stringNiobiumToBuffer } from './niobium.js';
import type { PrivateKeyComponents, PublicKeyComponents } from './pem.js';
import { modPow } from './rsa256.js';

/**
 * Per-product licensing configuration.
 *
 * Both fields come from the server product record (`keyprefix` / `keysalt`)
 * and must match on the server (sign) and client (verify) sides.
 */
export interface LicenseProductConfig {
  /** installationId prefix stripped before hashing, e.g. `R4VS`. */
  installationIdPrefix: string;
  /** Salt appended to the hash payload, e.g. `''` (Vectorscope) or `waveform`. */
  licenseHashSalt: string;
}

/** Default config (Retouch4me Vectorscope): prefix `R4VS`, empty salt. */
export const DEFAULT_LICENSE_PRODUCT_CONFIG: LicenseProductConfig = {
  installationIdPrefix: 'R4VS',
  licenseHashSalt: '',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeInstallationId(
  installationId: string,
  prefix: string,
): string {
  if (!prefix) return installationId;
  return installationId.replace(new RegExp(`^${escapeRegExp(prefix)}-`), '');
}

/**
 * Builds the SHA-256 hash payload for a license key.
 *
 * Payload: `SHA256(normalizedInstallationId + "|" + email + licenseHashSalt)`.
 * Note: the salt is appended directly to `email` (no `|` separator).
 */
export function createHash256(
  email: string,
  installationId: string,
  config: LicenseProductConfig = DEFAULT_LICENSE_PRODUCT_CONFIG,
): Buffer {
  const normalizedId = normalizeInstallationId(
    installationId,
    config.installationIdPrefix,
  );
  const data = `${normalizedId}|${email}${config.licenseHashSalt}`;
  return crypto.createHash('sha256').update(data).digest();
}

export interface SignResult {
  signature: string;
  hashHex: string;
  signatureHex: string;
}

export function signLicenseKey(
  email: string,
  installationId: string,
  privateKey: PrivateKeyComponents,
  config: LicenseProductConfig = DEFAULT_LICENSE_PRODUCT_CONFIG,
): SignResult {
  if (!email) throw new Error('signLicenseKey: email is empty');
  if (!installationId) throw new Error('signLicenseKey: installationId is empty');

  const hashBytes = createHash256(email, installationId, config);
  const hashMod = BigInt(`0x${hashBytes.toString('hex')}`) % privateKey.n;
  const signature = modPow(hashMod, privateKey.d, privateKey.n);

  const signatureHex = signature.toString(16).padStart(64, '0');
  const signatureBytes = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    signatureBytes[i] = parseInt(signatureHex.substr(i * 2, 2), 16);
  }

  return {
    signature: bufferToNiobiumString(signatureBytes),
    hashHex: hashBytes.toString('hex'),
    signatureHex,
  };
}

export function verifyLicenseKey(
  email: string,
  installationId: string,
  signatureBase41: string,
  publicKey: PublicKeyComponents,
  config: LicenseProductConfig = DEFAULT_LICENSE_PRODUCT_CONFIG,
): boolean {
  const signatureBytes = stringNiobiumToBuffer(signatureBase41);
  const signatureBigInt = BigInt(`0x${Buffer.from(signatureBytes).toString('hex')}`);
  const decrypted = modPow(signatureBigInt, publicKey.e, publicKey.n);

  const hashBytes = createHash256(email, installationId, config);
  const hashMod = BigInt(`0x${hashBytes.toString('hex')}`) % publicKey.n;

  return decrypted === hashMod;
}
