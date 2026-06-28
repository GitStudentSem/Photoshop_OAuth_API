import crypto from 'node:crypto';
import { bufferToNiobiumString, stringNiobiumToBuffer } from './niobium.js';
import type { PrivateKeyComponents, PublicKeyComponents } from './pem.js';
import { modPow } from './rsa256.js';

export function normalizeInstallationId(installationId: string): string {
  return installationId.replace(/^R4VS-/, '');
}

export function createHash256(email: string, installationId: string): Buffer {
  const normalizedId = normalizeInstallationId(installationId);
  const data = `${normalizedId}|${email}`;
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
): SignResult {
  if (!email) throw new Error('signLicenseKey: email is empty');
  if (!installationId) throw new Error('signLicenseKey: installationId is empty');

  const hashBytes = createHash256(email, installationId);
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
): boolean {
  const signatureBytes = stringNiobiumToBuffer(signatureBase41);
  const signatureBigInt = BigInt(`0x${Buffer.from(signatureBytes).toString('hex')}`);
  const decrypted = modPow(signatureBigInt, publicKey.e, publicKey.n);

  const hashBytes = createHash256(email, installationId);
  const hashMod = BigInt(`0x${hashBytes.toString('hex')}`) % publicKey.n;

  return decrypted === hashMod;
}
