#!/usr/bin/env node
// Counts attendees, derives the YYYY-MM-DD-topic.md filename, and reports whether that
// file already exists. Node, no dependencies.
//
//   node scripts/notes-file.mjs --transcript <path> --topic "<topic>" \
//     --attendees "Name; Name; Name" [--date YYYY-MM-DD]
//
// Prints JSON: { count, filename, path, exists }

import { existsSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  args[key.slice(2)] = process.argv[i + 1] ?? "";
}

if (!args.transcript || !args.topic) {
  console.error("usage: notes-file.mjs --transcript <path> --topic <topic> [--attendees <a; b>] [--date YYYY-MM-DD]");
  process.exit(2);
}

const transcript = resolve(args.transcript);

const dateFromName = basename(transcript).match(/(\d{4}-\d{2}-\d{2})/);
const date =
  args.date ||
  (dateFromName ? dateFromName[1] : new Date().toISOString().slice(0, 10));

const slug = args.topic
  .toLowerCase()
  .replace(/['"]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const attendees = (args.attendees || "")
  .split(/[;\n]/)
  .map((name) => name.trim())
  .filter(Boolean);

const unique = [...new Set(attendees)];
const filename = `${date}-${slug}.md`;
const path = join(dirname(transcript), filename);

console.log(
  JSON.stringify(
    { count: unique.length, attendees: unique, filename, path, exists: existsSync(path) },
    null,
    2,
  ),
);
