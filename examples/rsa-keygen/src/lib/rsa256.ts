import crypto from 'node:crypto';

export interface RsaKeyPair {
  n: bigint;
  e: bigint;
  d: bigint;
  p: bigint;
  q: bigint;
}

function extendedGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [gcd, x1, y1] = extendedGcd(b, a % b);
  return [gcd, y1, x1 - (a / b) * y1];
}

function modInverse(e: bigint, phi: bigint): bigint {
  const [gcd, x] = extendedGcd(e, phi);
  if (gcd !== 1n) {
    throw new Error('Modular inversion does not exist');
  }
  return ((x % phi) + phi) % phi;
}

export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
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

function millerRabin(n: bigint, k = 10): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  let r = 0n;
  let d = n - 1n;
  while (d % 2n === 0n) {
    r++;
    d /= 2n;
  }

  for (let i = 0; i < k; i++) {
    const range = n - 4n;
    const randomBytes = crypto.randomBytes(32);
    const a = 2n + (BigInt(`0x${randomBytes.toString('hex')}`) % range);
    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) continue;

    let continueLoop = false;
    for (let j = 0n; j < r - 1n; j++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        continueLoop = true;
        break;
      }
    }
    if (continueLoop) continue;
    return false;
  }

  return true;
}

function generatePrime(bits: number): bigint {
  const bytes = Math.ceil(bits / 8);
  while (true) {
    const randomBytes = crypto.randomBytes(bytes);
    randomBytes[0] |= 0x80;
    randomBytes[bytes - 1] |= 0x01;

    let candidate = BigInt(`0x${randomBytes.toString('hex')}`);
    const mask = (1n << BigInt(bits)) - 1n;
    candidate = candidate & mask;
    candidate |= 1n << BigInt(bits - 1);
    candidate |= 1n;

    if (millerRabin(candidate, 20)) {
      return candidate;
    }
  }
}

/** Generates RSA-256 key pair (two 128-bit primes). */
export function generateKeyPair(): RsaKeyPair {
  const p = generatePrime(128);
  const q = generatePrime(128);
  if (p === q) {
    return generateKeyPair();
  }

  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const e = 65537n;

  const [gcd] = extendedGcd(e, phi);
  if (gcd !== 1n) {
    return generateKeyPair();
  }

  const d = modInverse(e, phi);
  return { n, e, d, p, q };
}
