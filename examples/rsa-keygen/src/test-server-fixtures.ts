#!/usr/bin/env node

import fs from 'node:fs';
import {
  parsePublicKeyPem,
  readPrivateKeyFile,
  resolveProduct,
  signLicenseKey,
  verifyLicenseKey,
} from './index.js';
import { DEFAULT_KEYS_DIR, keyFilePaths } from './lib/paths.js';
import {
  PRODUCTION_PUBLIC_KEY_PEM,
  SERVER_FIXTURE_SUITES,
} from './lib/server-fixtures.js';

function resolveProductionPublicKey() {
  const keysPublicPath = keyFilePaths(DEFAULT_KEYS_DIR).publicPath;
  if (fs.existsSync(keysPublicPath)) {
    return parsePublicKeyPem(fs.readFileSync(keysPublicPath, 'utf8'));
  }
  return parsePublicKeyPem(PRODUCTION_PUBLIC_KEY_PEM);
}

function resolveProductionPrivateKey() {
  const privatePath = keyFilePaths(DEFAULT_KEYS_DIR).privatePath;
  if (!fs.existsSync(privatePath)) {
    return null;
  }
  return readPrivateKeyFile(privatePath);
}

let passed = 0;
let failed = 0;

console.log('\nServer fixture test — verify local RSA matches server output\n');

const publicKey = resolveProductionPublicKey();
const privateKey = resolveProductionPrivateKey();

if (privateKey) {
  console.log(`Private key: ${keyFilePaths(DEFAULT_KEYS_DIR).privatePath} (sign round-trip enabled)`);
} else {
  console.log('Private key: not found — verify-only mode (place keys/private.pem to also test sign)');
}

console.log('');

for (const suite of SERVER_FIXTURE_SUITES) {
  const product = resolveProduct(suite.productKey);
  console.log(
    `[${suite.productKey} / ${suite.productId}] ${suite.description}`,
  );
  console.log(
    `  prefix=${product.installationIdPrefix} salt="${product.licenseHashSalt}" label=${product.label}`,
  );

  for (const fixture of suite.cases) {
    const label = `${fixture.email}  ${fixture.installationId}`;

    const verifyOk = verifyLicenseKey(
      fixture.email,
      fixture.installationId,
      fixture.licenseKey,
      publicKey,
      product,
    );

    if (!verifyOk) {
      failed++;
      console.error(`  FAIL verify  ${label}`);
      continue;
    }

    passed++;
    console.log(`  OK   verify  ${fixture.email}`);

    if (privateKey) {
      const { signature } = signLicenseKey(
        fixture.email,
        fixture.installationId,
        privateKey,
        product,
      );

      if (signature !== fixture.licenseKey) {
        failed++;
        console.error(`  FAIL sign     ${fixture.email} (local key differs from server)`);
        console.error(`         server: ${fixture.licenseKey}`);
        console.error(`         local:  ${signature}`);
        continue;
      }

      passed++;
      console.log(`  OK   sign      ${fixture.email}`);
    }
  }

  // Control: key must not verify with wrong hash parameters.
  const first = suite.cases[0];
  const wrongConfig = product.licenseHashSalt
    ? { installationIdPrefix: product.installationIdPrefix, licenseHashSalt: '' }
    : { installationIdPrefix: product.installationIdPrefix, licenseHashSalt: 'waveform' };
  const controlLabel = product.licenseHashSalt
    ? 'rejects key without salt'
    : 'rejects key with wrong salt';

  if (verifyLicenseKey(first.email, first.installationId, first.licenseKey, publicKey, wrongConfig)) {
    failed++;
    console.error(`  FAIL control  ${first.email} (${controlLabel})`);
  } else {
    passed++;
    console.log(`  OK   control   ${controlLabel}`);
  }

  console.log('');
}

console.log('='.repeat(50));
console.log(`  Passed:  ${passed}`);
console.log(`  Failed:  ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\nAll server fixture tests passed.\n');
} else {
  console.log('\nServer fixture tests failed.\n');
  process.exit(1);
}
