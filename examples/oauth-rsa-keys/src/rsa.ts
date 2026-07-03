import forge from 'node-forge';
import { ClientError } from './ClientError';

const FILE_NAME = 'rsa';

const BASE_NIOBIUM_CHARS = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ*=$~?!+@';

const CHAR_TO_VALUE = new Map<string, number>();
for (let i = 0; i < BASE_NIOBIUM_CHARS.length; i++) {
  CHAR_TO_VALUE.set(BASE_NIOBIUM_CHARS[i], i);
}

export function stringNiobiumToBuffer(message: string): Uint8Array {
  const clean = message.replace(/[-\s]/g, '').toUpperCase();

  if (clean.length % 3 !== 0) {
    throw new ClientError('Length must be a multiple of 3', FILE_NAME, 'stringNiobiumToBuffer');
  }

  const numGroups = clean.length / 3;
  const result = new Uint8Array(numGroups * 2);

  for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
    const start = groupIndex * 3;
    const chunk = clean.slice(start, start + 3);

    let value = 0n;
    for (let pos = 0; pos < 3; pos++) {
      const char = chunk[pos];
      const digit = CHAR_TO_VALUE.get(char);
      if (digit === undefined) {
        throw new ClientError('Invalid character', FILE_NAME, 'stringNiobiumToBuffer');
      }
      value = value * 41n + BigInt(digit);
    }

    if (value > 0xffffn) {
      throw new ClientError('Buffer overflow', FILE_NAME, 'stringNiobiumToBuffer');
    }

    const num = Number(value);
    const byteIndex = groupIndex * 2;
    result[byteIndex] = num & 0xff;
    result[byteIndex + 1] = (num >> 8) & 0xff;
  }

  return result;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

function hexToBigInt(hex: string): bigint {
  return BigInt(`0x${hex}`);
}

function uint8ArrayToBigInt(arr: Uint8Array): bigint {
  let hex = '';
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i].toString(16).padStart(2, '0');
  }
  return BigInt(`0x${hex}`);
}

export function parsePublicKeyPem(pem: string): { n: bigint; e: bigint } {
  const lines = pem
    .trim()
    .split('\n')
    .filter((l) => !l.startsWith('-----'));
  const n = hexToBigInt(lines[0].trim());
  const e = hexToBigInt(lines[1].trim());
  return { n, e };
}

/**
 * Per-product licensing configuration.
 *
 * Both fields come from the server product record (`keyprefix` / `keysalt`)
 * and must match the server side that signs the license.
 */
export interface LicenseProductConfig {
  /** installationId prefix stripped before hashing, e.g. `R4VS`. */
  installationIdPrefix: string;
  /** Salt appended to the hash payload, e.g. `''` (Vectorscope) or `waveform`. */
  licenseHashSalt: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeInstallationId(installationId: string, prefix: string): string {
  if (!prefix) return installationId;
  return installationId.replace(new RegExp(`^${escapeRegExp(prefix)}-`), '');
}

/**
 * Builds the license hash: `SHA256(normalizedInstallationId + "|" + email + salt)`.
 * The salt is appended directly to `email` (no `|` separator).
 */
function createHash256(
  email: string,
  installationId: string,
  config: LicenseProductConfig,
): Uint8Array {
  const normalizedId = normalizeInstallationId(installationId, config.installationIdPrefix);
  const data = `${normalizedId}|${email}${config.licenseHashSalt}`;
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  const fullHash = md.digest().toHex();
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(fullHash.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function verifyLicenseKey(
  email: string,
  installationId: string,
  licenseKeyBase41: string,
  publicKeyPem: string,
  config: LicenseProductConfig,
): boolean {
  const { n, e } = parsePublicKeyPem(publicKeyPem);
  const signatureBytes = stringNiobiumToBuffer(licenseKeyBase41);
  const signatureBigInt = uint8ArrayToBigInt(signatureBytes);
  const decrypted = modPow(signatureBigInt, e, n);
  const hashBytes = createHash256(email, installationId, config);
  const hashBigInt = uint8ArrayToBigInt(hashBytes);
  const hashMod = hashBigInt % n;
  return decrypted === hashMod;
}
