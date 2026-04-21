import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bookingMessages } from "../src/i18n/bookingTranslations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "public/bookings-embed/booking-translations.en.json");
const scopedPaths = [
  "src/features/events",
  "src/components/calendar",
  "src/components/ui/form/BookingForm",
  "src/components/FanBookingFlow/OneOnOneBookingFlow",
  "src/components/FanBookingFlow/HelperComponents",
  "src/embeds/events",
  "src/embeds/fanBooking",
].map((entry) => path.join(rootDir, entry));

const SOURCE_EXTENSIONS = new Set([".vue", ".js", ".ts"]);

async function listSourceFiles(dir) {
  const rows = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(rows.map(async (row) => {
    const fullPath = path.join(dir, row.name);
    if (row.isDirectory()) return listSourceFiles(fullPath);
    if (!SOURCE_EXTENSIONS.has(path.extname(row.name))) return [];
    return [fullPath];
  }));
  return files.flat();
}

function collectTranslationKeys(source) {
  const keys = new Set();
  const pattern = /\bt\(\s*(['"`])([a-zA-Z0-9_]+)\1/g;
  let match;
  while ((match = pattern.exec(source))) {
    keys.add(match[2]);
  }
  return keys;
}

async function checkUsedKeys() {
  const files = (await Promise.all(scopedPaths.map(listSourceFiles))).flat();
  const usedKeys = new Set();
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const key of collectTranslationKeys(source)) {
      usedKeys.add(key);
    }
  }

  const missing = [...usedKeys].filter((key) => !Object.prototype.hasOwnProperty.call(bookingMessages, key)).sort();
  if (missing.length) {
    throw new Error(`Missing booking translation keys:\n${missing.map((key) => `- ${key}`).join("\n")}`);
  }
}

function sortedMessages() {
  return Object.keys(bookingMessages).sort().reduce((acc, key) => {
    acc[key] = bookingMessages[key];
    return acc;
  }, {});
}

await checkUsedKeys();
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(sortedMessages(), null, 2)}\n`);
console.log(`Exported ${Object.keys(bookingMessages).length} booking translation strings to ${path.relative(rootDir, outputPath)}`);
