const BASE_NIOBIUM_CHARS = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ*=$~?!+@';

const CHAR_TO_VALUE = new Map<string, number>();
for (let i = 0; i < BASE_NIOBIUM_CHARS.length; i++) {
  CHAR_TO_VALUE.set(BASE_NIOBIUM_CHARS[i], i);
}

export function bufferToNiobiumString(data: Uint8Array): string {
  if (data.length % 2 !== 0) {
    throw new Error('Odd number of bytes');
  }

  const numPairs = data.length / 2;
  const parts: string[] = [];

  for (let i = 0; i < numPairs; i++) {
    const lo = data[i * 2];
    const hi = data[i * 2 + 1];
    const value = (hi << 8) | lo;
    const digits: number[] = [];
    let temp = value;

    for (let pos = 0; pos < 3; pos++) {
      digits.push(temp % 41);
      temp = Math.floor(temp / 41);
    }

    parts.push(
      BASE_NIOBIUM_CHARS[digits[2]] +
        BASE_NIOBIUM_CHARS[digits[1]] +
        BASE_NIOBIUM_CHARS[digits[0]],
    );
  }

  return parts.join('');
}

export function stringNiobiumToBuffer(message: string): Uint8Array {
  const clean = message.replace(/[-\s]/g, '').toUpperCase();

  if (clean.length % 3 !== 0) {
    throw new Error('Length must be a multiple of 3');
  }

  const numGroups = clean.length / 3;
  const result = new Uint8Array(numGroups * 2);

  for (let g = 0; g < numGroups; g++) {
    const chunk = clean.slice(g * 3, g * 3 + 3);
    let value = 0n;

    for (let p = 0; p < 3; p++) {
      const digit = CHAR_TO_VALUE.get(chunk[p]);
      if (digit === undefined) {
        throw new Error(`Invalid character: ${chunk[p]}`);
      }
      value = value * 41n + BigInt(digit);
    }

    if (value > 0xffffn) {
      throw new Error('Buffer overflow');
    }

    const num = Number(value);
    result[g * 2] = num & 0xff;
    result[g * 2 + 1] = (num >> 8) & 0xff;
  }

  return result;
}
