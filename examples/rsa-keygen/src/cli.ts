#!/usr/bin/env node

import fs from 'node:fs';
import {
  formatAppPublicKeySnippet,
  generateKeyPair,
  readPrivateKeyFile,
  readPublicKeyFile,
  resolveKeysDir,
  resolveProduct,
  saveKeyPair,
  signLicenseKey,
  verifyLicenseKey,
  PRODUCTS,
  type LicenseProductConfig,
} from './index.js';
import { keyFilePaths } from './lib/paths.js';

function printHelp() {
  const productList = Object.entries(PRODUCTS)
    .map(
      ([key, p]) =>
        `      ${key} (prefix ${p.installationIdPrefix}, salt "${p.licenseHashSalt}")`,
    )
    .join('\n');

  console.log(`
RSA-256 License Key Generator

Commands:
  generate [--keys <dir>]              Generate a new RSA-256 key pair
  sign <email> <installationId>        Sign email + installationId → Base41 license key
  verify <email> <installationId> <key> Verify a Base41 license key
  export-public [--keys <dir>]         Print publicKey snippet for appInfo.ts

Options:
  --keys <dir>       Keys directory (default: ./keys)
  --product <name>   Product preset (prefix + salt). Default: vectorscope
  --prefix <prefix>  Override installationId prefix (e.g. R4VS)
  --salt <salt>      Override license hash salt (e.g. "" or waveform)

Products:
${productList}

Examples:
  npm run keygen -- generate
  npm run keygen -- sign user@example.com R4VS-ABCD-1234-XYZZY
  npm run keygen -- sign user@example.com R4WF-GPIE-6439-SHITG --product waveform
  npm run keygen -- verify user@example.com R4VS-ABCD-1234-XYZZY ABC123...
  npm run keygen -- export-public

Hash payload:
  SHA256(normalizedInstallationId + "|" + email + salt)
  - normalizedInstallationId = installationId without "<prefix>-"
  - salt is appended directly to email (no "|" separator)

Notes:
  - Public key goes into the client app (e.g. appInfo.ts)
  - Private key stays on the server / keygen machine only
  - installationId may include or omit the "<prefix>-" prefix
`);
}

interface ParsedArgs {
  command: string | undefined;
  args: string[];
  keysDir: string;
  product: LicenseProductConfig;
}

function parseArgs(argv: string[]): ParsedArgs {
  let keysDir: string | undefined;
  let productName: string | undefined;
  let prefixOverride: string | undefined;
  let saltOverride: string | undefined;
  const positional: string[] = [];

  const valueFlags: Record<string, (v: string) => void> = {
    '--keys': (v) => {
      keysDir = v;
    },
    '--product': (v) => {
      productName = v;
    },
    '--prefix': (v) => {
      prefixOverride = v;
    },
    '--salt': (v) => {
      saltOverride = v;
    },
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const handler = valueFlags[arg];
    if (handler) {
      handler(argv[i + 1] ?? '');
      i++;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  const base = resolveProduct(productName);
  const product: LicenseProductConfig = {
    installationIdPrefix: prefixOverride ?? base.installationIdPrefix,
    licenseHashSalt: saltOverride ?? base.licenseHashSalt,
  };

  return {
    command: positional[0],
    args: positional.slice(1),
    keysDir: resolveKeysDir(keysDir),
    product,
  };
}

function ensureKeysExist(keysDir: string) {
  const { publicPath, privatePath } = keyFilePaths(keysDir);
  if (!fs.existsSync(publicPath) || !fs.existsSync(privatePath)) {
    throw new Error(
      `Keys not found in ${keysDir}. Run: npm run keygen -- generate --keys ${keysDir}`,
    );
  }
}

async function main() {
  const { command, args, keysDir, product } = parseArgs(process.argv.slice(2));

  switch (command) {
    case 'generate': {
      console.log('Generating RSA-256 key pair...');
      const keys = generateKeyPair();
      const saved = saveKeyPair(keys, keysDir);

      console.log(`p = ${keys.p.toString(16)}`);
      console.log(`q = ${keys.q.toString(16)}`);
      console.log(
        `n = ${keys.n.toString(16)} (${keys.n.toString(16).length * 4} bits)`,
      );
      console.log(`e = ${keys.e.toString(16)}`);
      console.log(`d = ${keys.d.toString(16)}`);
      console.log('\nKeys saved:');
      console.log(`  Public:  ${saved.publicPath}`);
      console.log(`  Private: ${saved.privatePath}`);
      console.log('\nNext step — copy public key into your app:');
      console.log(`  npm run keygen -- export-public --keys ${keysDir}`);
      console.log('\nDone.');
      break;
    }

    case 'sign': {
      if (args.length < 2) {
        console.error('Usage: sign <email> <installationId> [--keys <dir>]');
        process.exit(1);
      }
      ensureKeysExist(keysDir);
      const privateKey = readPrivateKeyFile(keyFilePaths(keysDir).privatePath);
      const result = signLicenseKey(args[0], args[1], privateKey, product);

      console.log('\n=== Sign result ===');
      console.log(`Email:           ${args[0]}`);
      console.log(`Installation ID: ${args[1]}`);
      console.log(`Prefix:          ${product.installationIdPrefix}`);
      console.log(`Salt:            "${product.licenseHashSalt}"`);
      console.log(`Hash (hex):      ${result.hashHex}`);
      console.log(`Signature (hex): ${result.signatureHex}`);
      console.log('\nLicense key (Base41):');
      console.log(result.signature);
      break;
    }

    case 'verify': {
      if (args.length < 3) {
        console.error(
          'Usage: verify <email> <installationId> <licenseKey> [--keys <dir>]',
        );
        process.exit(1);
      }
      ensureKeysExist(keysDir);
      const publicKey = readPublicKeyFile(keyFilePaths(keysDir).publicPath);
      const isValid = verifyLicenseKey(args[0], args[1], args[2], publicKey, product);
      console.log(isValid ? '\nSignature is VALID' : '\nSignature is INVALID');
      process.exit(isValid ? 0 : 1);
    }

    case 'export-public': {
      ensureKeysExist(keysDir);
      const publicKey = readPublicKeyFile(keyFilePaths(keysDir).publicPath);
      const pem = [
        '-----BEGIN RSA-256 PUBLIC KEY-----',
        publicKey.n.toString(16),
        publicKey.e.toString(16),
        '-----END RSA-256 PUBLIC KEY-----',
      ].join('\n');

      console.log('\nPaste into appInfo.ts:\n');
      console.log(formatAppPublicKeySnippet(pem));
      console.log('');
      break;
    }

    default:
      printHelp();
      process.exit(command ? 1 : 0);
  }
}

main().catch((error: Error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
