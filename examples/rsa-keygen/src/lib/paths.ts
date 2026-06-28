import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_KEYS_DIR = path.resolve(__dirname, '../../keys');

export function resolveKeysDir(customDir?: string): string {
  if (!customDir) {
    return DEFAULT_KEYS_DIR;
  }
  return path.resolve(process.cwd(), customDir);
}

export function keyFilePaths(keysDir: string) {
  return {
    publicPath: path.join(keysDir, 'public.pem'),
    privatePath: path.join(keysDir, 'private.pem'),
  };
}
