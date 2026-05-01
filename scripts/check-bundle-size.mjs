import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const distDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const limits = {
  js: 500 * 1024,
  css: 120 * 1024,
};

const files = readdirSync(distDir);
const failures = [];

for (const file of files) {
  const ext = file.endsWith(".js") ? "js" : file.endsWith(".css") ? "css" : null;
  if (!ext) continue;
  const size = statSync(join(distDir, file)).size;
  const limit = limits[ext];
  if (size > limit) {
    failures.push(`${file}: ${Math.round(size / 1024)} KiB > ${Math.round(limit / 1024)} KiB`);
  }
}

if (failures.length) {
  console.error("Bundle size budget failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Bundle size budget passed.");
