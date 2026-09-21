#!/usr/bin/env node
// apply.mjs — swaps an optimized copy in, keeping the original.
//
//   node scripts/apply.mjs <path>           <path> → <path>.before, <path>.optimized → <path>
//   node scripts/apply.mjs <path> --undo    the reverse
//
// It refuses rather than overwrite: the original is never lost, and a second
// apply over an unreviewed `.before` is a stop.

import { existsSync, statSync, renameSync, mkdirSync, readdirSync, rmdirSync } from "node:fs";
import { join, basename } from "node:path";

export class Refusal extends Error {}

const refuse = (msg) => {
  throw new Refusal(msg);
};

const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

function moveOthers(from, to, except) {
  for (const name of readdirSync(from)) if (name !== except) renameSync(join(from, name), join(to, name));
}

export function apply(target) {
  const path = target.replace(/\/$/, "");
  const optimized = `${path}.optimized`;
  const before = `${path}.before`;
  if (!existsSync(path)) refuse(`no target at ${path}`);
  if (!existsSync(optimized)) refuse(`no optimized copy at ${optimized}`);
  if (existsSync(before)) refuse(`${before} is already there; review or remove it first`);

  if (isDir(path)) {
    renameSync(path, before);
    renameSync(optimized, path);
    return { applied: path, kept: before };
  }
  const name = basename(path);
  if (!existsSync(join(optimized, name))) refuse(`${optimized} holds no ${name}`);
  mkdirSync(before, { recursive: true });
  renameSync(path, join(before, name));
  renameSync(join(optimized, name), path);
  moveOthers(optimized, before, name);
  rmdirSync(optimized);
  return { applied: path, kept: before };
}

export function undo(target) {
  const path = target.replace(/\/$/, "");
  const optimized = `${path}.optimized`;
  const before = `${path}.before`;
  if (!existsSync(before)) refuse(`nothing to undo: no ${before}`);
  if (existsSync(optimized)) refuse(`${optimized} is already there; remove it first`);

  if (isDir(path)) {
    renameSync(path, optimized);
    renameSync(before, path);
    return { restored: path, optimized };
  }
  const name = basename(path);
  mkdirSync(optimized, { recursive: true });
  renameSync(path, join(optimized, name));
  moveOthers(before, optimized, name);
  renameSync(join(before, name), path);
  rmdirSync(before);
  return { restored: path, optimized };
}

const invoked = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (invoked) {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith("--"));
  if (!target) {
    console.error("usage: node scripts/apply.mjs <path> [--undo]");
    process.exit(2);
  }
  try {
    const r = args.includes("--undo") ? undo(target) : apply(target);
    console.log(r.applied ? `applied: ${r.applied}   original kept at: ${r.kept}` : `restored: ${r.restored}   optimized copy back at: ${r.optimized}`);
  } catch (e) {
    console.error(e instanceof Refusal ? `refused: ${e.message}` : e.message);
    process.exit(1);
  }
}
