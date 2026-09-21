#!/usr/bin/env node
// measure.mjs — counts for one target: a skill folder, an agent .md, or a CLAUDE.md.
//
//   node scripts/measure.mjs <path>                  text
//   node scripts/measure.mjs <path> --json           the same object
//   node scripts/measure.mjs <path> --diff <other>   the before → after block
//
// Counting only. It reads; it changes nothing.

import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from "node:fs";
import { join, basename } from "node:path";
import { pathToFileURL } from "node:url";

export class Refusal extends Error {}

const RULE_WORDS = [/\bMUST\b/, /\bNEVER\b/, /\bALWAYS\b/, /\bdo not\b/i, /\bdon't\b/i];
const PATH_PATTERNS = [/\/Users\/[\w.-]+(?:\/[\w.-]+)*/g, /\/home\/[\w.-]+(?:\/[\w.-]+)*/g, /[A-Za-z]:\\[\w.\\-]+/g, /OneDrive/gi];
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
  // A quoted scalar is the description, not the quotes.
  return parts.join(" ").trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
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
const lines = (t) => {
  const text = t.endsWith("\n") ? t.slice(0, -1) : t;
  return text === "" ? 0 : text.split(/\r?\n/).length;
};

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const kindOfFile = (name) => (/^CLAUDE\.md$/i.test(basename(name)) ? "claudemd" : "agent");

// A folder is a skill when it holds a SKILL.md. A folder holding exactly one other
// `.md` — an `<agent>.md.optimized` beside its CHANGES.md — is that file.
export function resolve(target) {
  if (!(existsSync(target) && statSync(target).isDirectory())) {
    return { kind: kindOfFile(target), main: target };
  }
  if (existsSync(join(target, "SKILL.md"))) return { kind: "skill", main: join(target, "SKILL.md") };
  const mds = readdirSync(target).filter((n) => n.endsWith(".md") && n !== "CHANGES.md");
  if (mds.length !== 1) {
    throw new Refusal(`${target} holds no SKILL.md and no single .md to measure`);
  }
  return { kind: kindOfFile(mds[0]), main: join(target, mds[0]) };
}

export function detectKind(target) {
  return resolve(target).kind;
}

export function measure(target) {
  const { kind, main } = resolve(target);
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

// The before → after block: the target measured against its optimized copy.
export function renderDiff(a, b) {
  const plural = (x) => (x === 1 ? "file" : "files");
  return [
    `target: ${a.target}   kind: ${a.kind}`,
    "",
    "before \u2192 after",
    `body: ${n(a.body.lines)} \u2192 ${n(b.body.lines)} lines \u00b7 ${n(a.body.words)} \u2192 ${n(b.body.words)} words`,
    `rules: ${a.rules.total} \u2192 ${b.rules.total}     samples: ${a.examples} \u2192 ${b.examples}     absolute paths: ${a.absolutePaths.count} \u2192 ${b.absolutePaths.count}     session facts: ${a.sessionFacts.count} \u2192 ${b.sessionFacts.count}`,
    `references: ${n(a.references.lines)} \u2192 ${n(b.references.lines)} lines   scripts: ${a.scripts.files} \u2192 ${b.scripts.files} ${plural(b.scripts.files)}   repeated sentences: ${a.repeatedSentences} \u2192 ${b.repeatedSentences}`,
  ].join("\n");
}

// realpathSync first: argv[1] may reach us through a symlink, and pathToFileURL
// (never a hand-built `file://` string) encodes #, % and ? the way import.meta.url does.
const invoked = process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (invoked) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const d = args.indexOf("--diff");
  const other = d === -1 ? null : args[d + 1];
  const target = args.find((a, i) => !a.startsWith("--") && !(d !== -1 && i === d + 1));
  if (!target || (d !== -1 && !other)) {
    console.error("usage: node scripts/measure.mjs <path> [--json] [--diff <other>]");
    process.exit(2);
  }
  const trim = (p) => p.replace(/\/$/, "");
  try {
    const m = measure(trim(target));
    if (other) {
      const b = measure(trim(other));
      console.log(json ? JSON.stringify({ before: m, after: b }, null, 2) : renderDiff(m, b));
    } else {
      console.log(json ? JSON.stringify(m, null, 2) : render(m));
    }
  } catch (e) {
    console.error(e instanceof Refusal ? `refused: ${e.message}` : e.message);
    process.exit(1);
  }
}
