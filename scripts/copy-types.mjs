// scripts/copy-types.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve("src");
const DIST_DIR = path.resolve("dist");

// Все declaration-only файлы, которые нужно прокинуть в dist
const TYPE_FILES = ["OAuthTypes.d.ts"];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyFileToDist(relativePath) {
  const srcPath = path.join(SRC_DIR, relativePath);
  const distPath = path.join(DIST_DIR, relativePath);

  await ensureDir(path.dirname(distPath));
  await fs.copyFile(srcPath, distPath);

  console.log(`Copied: ${relativePath}`);
}

async function main() {
  await ensureDir(DIST_DIR);
  await Promise.all(TYPE_FILES.map(copyFileToDist));
}

main().catch((error) => {
  console.error("Failed to copy declaration files:", error);
  process.exit(1);
});