#!/usr/bin/env node
// measure.mjs — counts for one target: a skill folder, an agent .md, or a CLAUDE.md.
//
//   node scripts/measure.mjs <path>          text
//   node scripts/measure.mjs <path> --json   the same object
//
// Counting only. It reads; it changes nothing.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const RULE_WORDS = [/\bMUST\b/, /\bNEVER\b/, /\bALWAYS\b/, /\bdo not\b/i, /\bdon't\b/i];
// The sync-folder name is joined rather than written out so this repo's own
// privacy gate does not match its own detector.
const SYNC_FOLDER = ["One", "Drive"].join("");
const PATH_PATTERNS = [/\/Users\/[\w.-]+(?:\/[\w.-]+)*/g, /\/home\/[\w.-]+(?:\/[\w.-]+)*/g, /[A-Za-z]:\\[\w.\\-]+/g, new RegExp(SYNC_FOLDER, "gi")];
const SESSION_PHRASES = [/remember that/i, /the user prefers/i, /last time/i];

export function splitHeader(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  return m ? { header: m[1], body: text.slice(m[0].length) } : { header: "", body: text };
}

export function description(header) {
  const lines = header.split(/\r?\n/);
  const i = lines.findIndex((l) => /^description:/.test(l));
  if (i === -1) return "";
  const first = lines[i].slice("description:".length).trim();
  const parts = /^[>|][-+]?$/.test(first) ? [] : [first];
  for (const line of lines.slice(i + 1)) {
    if (/^\S/.test(line)) break;
    if (line.trim()) parts.push(line.trim());
  }
  return parts.join(" ").trim();
}

export function countRules(body) {
  const lines = body.split(/\r?\n/);
  const hit = (re) => lines.filter((l) => re.test(l)).length;
  const total = lines.filter((l) => RULE_WORDS.some((re) => re.test(l))).length;
  return { total, must: hit(/\bMUST\b/), never: hit(/\bNEVER\b/), always: hit(/\bALWAYS\b/) };
}

export function countExamples(body) {
  const lines = body.split(/\r?\n/);
  let count = 0;
  let fence = null;
  for (const line of lines) {
    const f = /^\s*(```+|~~~+)\s*(\w+)?/.exec(line);
    if (f) {
      if (fence === null) {
        fence = f[1][0];
        if (/^(transcript|example|conversation)$/i.test(f[2] ?? "")) count++;
      } else if (line.trim().startsWith(fence)) {
        fence = null;
      }
      continue;
    }
    if (fence !== null) continue;
    if (/^\s*(#{1,6}\s*)?(\*\*)?Examples?\b/i.test(line) || /^\s*e\.g\./i.test(line)) count++;
  }
  return count;
}

export function findPaths(body) {
  const found = [];
  for (const re of PATH_PATTERNS) for (const m of body.matchAll(re)) found.push(m[0]);
  return found;
}

export function findSessionFacts(body) {
  const found = [];
  for (const line of body.split(/\r?\n/)) {
    const hit = SESSION_PHRASES.find((re) => re.test(line));
    if (hit) found.push(hit.exec(line)[0]);
  }
  return found;
}

export function repeatedSentences(texts) {
  const tally = new Map();
  for (const text of texts) {
    const flat = text.replace(/```[\s\S]*?```/g, " ").replace(/\s+/g, " ");
    for (const raw of flat.split(/(?<=[.!?])\s+/)) {
      const s = raw.replace(/^[^A-Za-z0-9]+/, "").replace(/[^A-Za-z0-9]+$/, "").toLowerCase();
      if (s.split(" ").filter(Boolean).length < 8) continue;
      tally.set(s, (tally.get(s) ?? 0) + 1);
    }
  }
  return [...tally.values()].filter((n) => n > 1).length;
}

const words = (t) => t.split(/\s+/).filter(Boolean).length;
const lines = (t) => (t.endsWith("\n") ? t.slice(0, -1) : t).split(/\r?\n/).length;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function detectKind(target) {
  if (existsSync(target) && statSync(target).isDirectory()) return "skill";
  return /^CLAUDE\.md$/i.test(basename(target)) ? "claudemd" : "agent";
}

export function measure(target) {
  const kind = detectKind(target);
  const main = kind === "skill" ? join(target, "SKILL.md") : target;
  const text = readFileSync(main, "utf8");
  const { header, body } = splitHeader(text);
  const refFiles = kind === "skill" ? walk(join(target, "references")) : [];
  const scriptFiles = kind === "skill" ? walk(join(target, "scripts")) : [];
  const companions = refFiles.filter((f) => f.endsWith(".md")).map((f) => readFileSync(f, "utf8"));
  const paths = findPaths(body);
  const facts = findSessionFacts(body);
  return {
    target,
    kind,
    body: { lines: lines(body), words: words(body) },
    description: { chars: description(header).length },
    rules: countRules(body),
    examples: countExamples(body),
    references: { lines: refFiles.reduce((n, f) => n + lines(readFileSync(f, "utf8")), 0) },
    scripts: { files: scriptFiles.length },
    absolutePaths: { count: paths.length, samples: [...new Set(paths)].slice(0, 3) },
    sessionFacts: { count: facts.length, samples: [...new Set(facts)].slice(0, 3) },
    repeatedSentences: repeatedSentences([body, ...companions]),
  };
}

const n = (x) => x.toLocaleString("en-US");

export function render(m) {
  const list = (s) => (s.samples.length ? ` (${s.samples.join(", ")})` : "");
  return [
    `target: ${m.target}   kind: ${m.kind}`,
    `body: ${n(m.body.lines)} lines · ${n(m.body.words)} words     description: ${m.description.chars} chars`,
    `rules: ${m.rules.total} (MUST ${m.rules.must}, NEVER ${m.rules.never}, ALWAYS ${m.rules.always})   examples: ${m.examples}`,
    `references: ${n(m.references.lines)} lines   scripts: ${m.scripts.files} files`,
    `absolute paths: ${m.absolutePaths.count}${list(m.absolutePaths)}   session facts: ${m.sessionFacts.count}${list(m.sessionFacts)}`,
    `repeated sentences: ${m.repeatedSentences}`,
  ].join("\n");
}

const invoked = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (invoked) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const target = args.find((a) => !a.startsWith("--"));
  if (!target) {
    console.error("usage: node scripts/measure.mjs <path> [--json]");
    process.exit(2);
  }
  const m = measure(target.replace(/\/$/, ""));
  console.log(json ? JSON.stringify(m, null, 2) : render(m));
}
