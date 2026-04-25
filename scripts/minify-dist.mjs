import { promises as fs } from "node:fs";
import path from "node:path";
import { minify } from "terser";

const DIST_DIR = path.resolve("dist");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return fullPath;
    })
  );
  return files.flat();
}

const files = (await walk(DIST_DIR)).filter(
  (file) => file.endsWith(".js") && !file.endsWith(".min.js")
);

for (const file of files) {
  const code = await fs.readFile(file, "utf8");
  const result = await minify(code, {
    compress: true,
    mangle: true,
    format: { comments: false },
  });

  if (!result.code) throw new Error(`Minification failed for: ${file}`);

  // Вариант 1: перезаписывать исходный файл
  await fs.writeFile(file, result.code, "utf8");

  // Вариант 2 (вместо перезаписи): писать file.replace(/\.js$/, ".min.js")
}