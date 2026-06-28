import fs from 'node:fs';
import path from 'node:path';
import type { RsaKeyPair } from './rsa256.js';

export interface PublicKeyComponents {
  n: bigint;
  e: bigint;
}

export interface PrivateKeyComponents extends PublicKeyComponents {
  d: bigint;
}

export function formatPublicKeyPem(keys: PublicKeyComponents): string {
  return [
    '-----BEGIN RSA-256 PUBLIC KEY-----',
    keys.n.toString(16),
    keys.e.toString(16),
    '-----END RSA-256 PUBLIC KEY-----',
  ].join('\n');
}

export function formatPrivateKeyPem(keys: PrivateKeyComponents): string {
  return [
    '-----BEGIN RSA-256 PRIVATE KEY-----',
    keys.n.toString(16),
    keys.e.toString(16),
    keys.d.toString(16),
    '-----END RSA-256 PRIVATE KEY-----',
  ].join('\n');
}

export function parsePublicKeyPem(pem: string): PublicKeyComponents {
  const lines = pem
    .trim()
    .split('\n')
    .filter((l) => !l.startsWith('-----'));

  if (lines.length < 2) {
    throw new Error('Invalid public key PEM');
  }

  return {
    n: BigInt(`0x${lines[0].trim()}`),
    e: BigInt(`0x${lines[1].trim()}`),
  };
}

export function parsePrivateKeyPem(pem: string): PrivateKeyComponents {
  const lines = pem
    .trim()
    .split('\n')
    .filter((l) => !l.startsWith('-----'));

  if (lines.length < 3) {
    throw new Error('Invalid private key PEM');
  }

  return {
    n: BigInt(`0x${lines[0].trim()}`),
    e: BigInt(`0x${lines[1].trim()}`),
    d: BigInt(`0x${lines[2].trim()}`),
  };
}

export function readPublicKeyFile(filePath: string): PublicKeyComponents {
  return parsePublicKeyPem(fs.readFileSync(filePath, 'utf8'));
}

export function readPrivateKeyFile(filePath: string): PrivateKeyComponents {
  return parsePrivateKeyPem(fs.readFileSync(filePath, 'utf8'));
}

export interface SavedKeyPaths {
  keysDir: string;
  publicPath: string;
  privatePath: string;
  publicPem: string;
  privatePem: string;
}

export function saveKeyPair(keys: RsaKeyPair, keysDir: string): SavedKeyPaths {
  fs.mkdirSync(keysDir, { recursive: true });

  const publicPem = formatPublicKeyPem(keys);
  const privatePem = formatPrivateKeyPem(keys);
  const publicPath = path.join(keysDir, 'public.pem');
  const privatePath = path.join(keysDir, 'private.pem');

  fs.writeFileSync(publicPath, `${publicPem}\n`, 'utf8');
  fs.writeFileSync(privatePath, `${privatePem}\n`, 'utf8');

  return { keysDir, publicPath, privatePath, publicPem, privatePem };
}

export function formatAppPublicKeySnippet(publicPem: string): string {
  return `export const publicKey = \`${publicPem}\`;`;
}
