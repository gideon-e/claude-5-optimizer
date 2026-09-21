#!/usr/bin/env node
// apply.mjs — swaps an optimized copy in, keeping the original.
//
//   node scripts/apply.mjs <path>           <path> → <path>.before, <path>.optimized → <path>
//   node scripts/apply.mjs <path> --undo    the reverse
//
// It refuses rather than overwrite: the original is never lost, and a second
// apply over an unreviewed `.before` is a stop.

import { existsSync, statSync, renameSync, mkdirSync, readdirSync, rmdirSync, realpathSync } from "node:fs";
import { join, basename } from "node:path";
import { pathToFileURL } from "node:url";

export class Refusal extends Error {}

const refuse = (msg) => {
  throw new Refusal(msg);
};

const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const isFile = (p) => existsSync(p) && statSync(p).isFile();

function moveOthers(from, to, except, rename = renameSync) {
  for (const name of readdirSync(from)) if (name !== except) rename(join(from, name), join(to, name));
}

// `rename` is a seam for the tests: the half-done swap is the one failure worth proving.
export function apply(target, { rename = renameSync } = {}) {
  const path = target.replace(/\/$/, "");
  const optimized = `${path}.optimized`;
  const before = `${path}.before`;
  if (!existsSync(path)) refuse(`no target at ${path}`);
  if (!existsSync(optimized)) refuse(`no optimized copy at ${optimized}`);
  if (!isDir(optimized)) refuse(`${optimized} is a file; the optimized copy is a folder`);
  if (existsSync(before)) refuse(`${before} is already there; review or remove it first`);

  if (isDir(path)) {
    rename(path, before);
    try {
      rename(optimized, path);
    } catch (e) {
      // The original is back where the user left it, whatever went wrong second.
      rename(before, path);
      throw e;
    }
    return { applied: path, kept: before };
  }
  const name = basename(path);
  if (!existsSync(join(optimized, name))) refuse(`${optimized} holds no ${name}`);
  mkdirSync(before, { recursive: true });
  rename(path, join(before, name));
  rename(join(optimized, name), path);
  moveOthers(optimized, before, name, rename);
  rmdirSync(optimized);
  return { applied: path, kept: before };
}

export function undo(target) {
  const path = target.replace(/\/$/, "");
  const optimized = `${path}.optimized`;
  const before = `${path}.before`;
  if (!existsSync(before)) refuse(`nothing to undo: no ${before}`);
  if (!isDir(before)) refuse(`${before} is a file; the kept original is a folder`);
  if (existsSync(optimized)) refuse(`${optimized} is already there; remove it first`);

  // The layout to undo is the one `.before` holds, not whatever sits at the target now.
  const name = basename(path);
  const single = isFile(join(before, name));
  // Nothing at the target: there is nothing to set aside, so the original just goes back,
  // unwrapped out of `.before` when that is the layout it was kept in.
  if (!existsSync(path)) {
    if (!single) {
      renameSync(before, path);
      return { restored: path, optimized: null };
    }
    mkdirSync(optimized, { recursive: true });
    moveOthers(before, optimized, name);
    renameSync(join(before, name), path);
    rmdirSync(before);
    return { restored: path, optimized };
  }
  if (!single) {
    renameSync(path, optimized);
    renameSync(before, path);
    return { restored: path, optimized };
  }
  mkdirSync(optimized, { recursive: true });
  renameSync(path, join(optimized, name));
  moveOthers(before, optimized, name);
  renameSync(join(before, name), path);
  rmdirSync(before);
  return { restored: path, optimized };
}

// realpathSync first: argv[1] may reach us through a symlink, and pathToFileURL
// (never a hand-built `file://` string) encodes #, % and ? the way import.meta.url does.
const invoked = process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (invoked) {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith("--"));
  if (!target) {
    console.error("usage: node scripts/apply.mjs <path> [--undo]");
    process.exit(2);
  }
  try {
    const r = args.includes("--undo") ? undo(target) : apply(target);
    if (r.applied) console.log(`applied: ${r.applied}   original kept at: ${r.kept}`);
    else console.log(r.optimized ? `restored: ${r.restored}   optimized copy back at: ${r.optimized}` : `restored: ${r.restored}`);
  } catch (e) {
    console.error(e instanceof Refusal ? `refused: ${e.message}` : e.message);
    process.exit(1);
  }
}
