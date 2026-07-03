#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateKeyPair,
  readPrivateKeyFile,
  readPublicKeyFile,
  resolveProduct,
  saveKeyPair,
  signLicenseKey,
  verifyLicenseKey,
  type LicenseProductConfig,
} from './index.js';
import { keyFilePaths } from './lib/paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_KEYS_DIR = path.resolve(__dirname, '../keys/test-run');

// Same RSA pair is shared across products; licenses differ via prefix + salt.
const TEST_PRODUCTS: { name: string; config: LicenseProductConfig }[] = [
  { name: 'vectorscope', config: resolveProduct('vectorscope') },
  { name: 'waveform', config: resolveProduct('waveform') },
];

function randomEmail(): string {
  const names = ['alice', 'bob', 'user', 'test', 'admin', 'dev'];
  const domains = ['gmail.com', 'mail.ru', 'yandex.ru', 'test.org'];
  const name = names[Math.floor(Math.random() * names.length)];
  const num = Math.floor(Math.random() * 9999);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name}${num}@${domain}`;
}

function randomInstallationId(prefix: string): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${part(4)}-${part(4)}-${part(5)}`;
}

function ensureTestKeys() {
  const { publicPath, privatePath } = keyFilePaths(TEST_KEYS_DIR);
  if (fs.existsSync(publicPath) && fs.existsSync(privatePath)) {
    return;
  }
  saveKeyPair(generateKeyPair(), TEST_KEYS_DIR);
}

const iterations = Number.parseInt(process.argv[2] || '100', 10);

console.log(`\nRSA-256 test: ${iterations} iterations per product\n`);

ensureTestKeys();
const privateKey = readPrivateKeyFile(keyFilePaths(TEST_KEYS_DIR).privatePath);
const publicKey = readPublicKeyFile(keyFilePaths(TEST_KEYS_DIR).publicPath);

let passed = 0;
let failed = 0;
let falsePositives = 0;
const start = Date.now();

for (const { name, config } of TEST_PRODUCTS) {
  console.log(
    `\n[${name}] prefix=${config.installationIdPrefix} salt="${config.licenseHashSalt}"`,
  );

  for (let i = 0; i < iterations; i++) {
    const email = randomEmail();
    const installId = randomInstallationId(config.installationIdPrefix);

    const { signature: licenseKey } = signLicenseKey(email, installId, privateKey, config);

    if (!verifyLicenseKey(email, installId, licenseKey, publicKey, config)) {
      failed++;
      console.error(`  FAIL #${i + 1} valid key rejected: ${email} ${installId}`);
      continue;
    }

    if (verifyLicenseKey(`${email}.wrong`, installId, licenseKey, publicKey, config)) {
      falsePositives++;
      console.error(`  FALSE POSITIVE #${i + 1} wrong email accepted`);
      continue;
    }

    if (verifyLicenseKey(email, `${installId}-X`, licenseKey, publicKey, config)) {
      falsePositives++;
      console.error(`  FALSE POSITIVE #${i + 1} wrong installationId accepted`);
      continue;
    }

    passed++;

    if ((i + 1) % Math.max(1, Math.floor(iterations / 10)) === 0) {
      console.log(`  ${i + 1}/${iterations} ...`);
    }
  }
}

// Cross-product isolation: a key signed for one product must not verify for another.
const crossEmail = randomEmail();
const vs = TEST_PRODUCTS[0].config;
const wf = TEST_PRODUCTS[1].config;
const vsInstall = randomInstallationId(vs.installationIdPrefix);
const { signature: vsKey } = signLicenseKey(crossEmail, vsInstall, privateKey, vs);
const wfInstall = `${wf.installationIdPrefix}-${vsInstall.slice(vs.installationIdPrefix.length + 1)}`;
if (verifyLicenseKey(crossEmail, wfInstall, vsKey, publicKey, wf)) {
  falsePositives++;
  console.error('  FALSE POSITIVE cross-product key accepted (salt/prefix ignored)');
} else {
  passed++;
  console.log('\n[cross-product] different salt/prefix → key correctly rejected');
}

const elapsed = Date.now() - start;

console.log(`\n${'='.repeat(50)}`);
console.log(`  Passed:          ${passed}`);
console.log(`  Failed:          ${failed}`);
console.log(`  False positives: ${falsePositives}`);
console.log(`  Time:            ${elapsed} ms`);
console.log(`${'='.repeat(50)}`);

if (failed === 0 && falsePositives === 0) {
  console.log('\nAll tests passed.\n');
} else {
  console.log('\nTests failed.\n');
  process.exit(1);
}
