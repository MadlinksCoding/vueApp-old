import { spawnSync } from "node:child_process";
import { access, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const projectDir = dirname(scriptsDir);
const distDir = join(projectDir, "dist");
const archivePath = join(distDir, "wordpress-bookings.zip");
const archiveSources = ["assets/booking", "bookings-embed"];

for (const source of archiveSources) {
  try {
    await access(join(distDir, source), constants.R_OK);
  } catch {
    throw new Error(`Cannot create WordPress archive: dist/${source} is missing.`);
  }
}

await rm(archivePath, { force: true });

const result = spawnSync(
  "zip",
  ["-r", "-q", archivePath, ...archiveSources, "-x", "*.DS_Store"],
  {
    cwd: distDir,
    encoding: "utf8",
  }
);

if (result.error) {
  throw new Error(`Unable to run zip: ${result.error.message}`);
}

if (result.status !== 0) {
  throw new Error(
    `Unable to create WordPress archive.${result.stderr ? ` ${result.stderr.trim()}` : ""}`
  );
}

console.log(`[WORDPRESS_ARCHIVE] Created ${archivePath}`);
