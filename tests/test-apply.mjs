import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, statSync, rmSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply, undo, Refusal } from '../scripts/apply.mjs';

function skillFixture() {
  const root = mkdtempSync(join(tmpdir(), 'c5o-'));
  const target = join(root, 'notes');
  mkdirSync(target);
  writeFileSync(join(target, 'SKILL.md'), 'old body\n');
  mkdirSync(`${target}.optimized`);
  writeFileSync(join(`${target}.optimized`, 'SKILL.md'), 'new body\n');
  writeFileSync(join(`${target}.optimized`, 'CHANGES.md'), '- del: "old body"\n');
  return { root, target };
}

function agentFixture() {
  const root = mkdtempSync(join(tmpdir(), 'c5o-'));
  const target = join(root, 'reader.md');
  writeFileSync(target, 'old agent\n');
  mkdirSync(`${target}.optimized`);
  writeFileSync(join(`${target}.optimized`, 'reader.md'), 'new agent\n');
  writeFileSync(join(`${target}.optimized`, 'CHANGES.md'), '- del: "old agent"\n');
  return { root, target };
}

test('a skill folder swaps in and the original is kept', (t) => {
  const { root, target } = skillFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const r = apply(target);
  assert.equal(r.kept, `${target}.before`);
  assert.equal(readFileSync(join(target, 'SKILL.md'), 'utf8'), 'new body\n');
  assert.equal(readFileSync(join(`${target}.before`, 'SKILL.md'), 'utf8'), 'old body\n');
  assert.ok(existsSync(join(target, 'CHANGES.md')));
  assert.ok(!existsSync(`${target}.optimized`));
});

test('undo puts the original back and the optimized copy aside', (t) => {
  const { root, target } = skillFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  apply(target);
  undo(target);
  assert.equal(readFileSync(join(target, 'SKILL.md'), 'utf8'), 'old body\n');
  assert.equal(readFileSync(join(`${target}.optimized`, 'SKILL.md'), 'utf8'), 'new body\n');
  assert.ok(!existsSync(`${target}.before`));
});

test('a single agent file swaps in, CHANGES.md filed with the original', (t) => {
  const { root, target } = agentFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  apply(target);
  assert.equal(readFileSync(target, 'utf8'), 'new agent\n');
  assert.equal(readFileSync(join(`${target}.before`, 'reader.md'), 'utf8'), 'old agent\n');
  assert.ok(existsSync(join(`${target}.before`, 'CHANGES.md')));
  undo(target);
  assert.equal(readFileSync(target, 'utf8'), 'old agent\n');
  assert.equal(readFileSync(join(`${target}.optimized`, 'reader.md'), 'utf8'), 'new agent\n');
});

test('a second apply over an existing .before is refused', (t) => {
  const { root, target } = skillFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  apply(target);
  mkdirSync(`${target}.optimized`);
  writeFileSync(join(`${target}.optimized`, 'SKILL.md'), 'newer body\n');
  assert.throws(() => apply(target), Refusal);
  assert.equal(readFileSync(join(`${target}.before`, 'SKILL.md'), 'utf8'), 'old body\n');
});

test('apply with nothing to apply, and undo with nothing to undo, are refusals', (t) => {
  const { root, target } = skillFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.throws(() => undo(target), Refusal);
  rmSync(`${target}.optimized`, { recursive: true });
  assert.throws(() => apply(target), Refusal);
  assert.throws(() => apply(join(root, 'absent')), Refusal);
});

test('an optimized copy that is a file, not a folder, is refused', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'c5o-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const target = join(root, 'reader.md');
  writeFileSync(target, 'old agent\n');
  writeFileSync(`${target}.optimized`, 'new agent\n');
  assert.throws(() => apply(target), Refusal);
  assert.equal(readFileSync(target, 'utf8'), 'old agent\n');
});

test('a .before that is a file, not a folder, is refused by undo', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'c5o-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const target = join(root, 'reader.md');
  writeFileSync(target, 'new agent\n');
  writeFileSync(`${target}.before`, 'old agent\n');
  assert.throws(() => undo(target), Refusal);
  assert.equal(readFileSync(`${target}.before`, 'utf8'), 'old agent\n');
});

test('undo with the applied target gone puts the original back and blocks nothing after', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'c5o-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { target } = { target: join(root, 'notes') };
  mkdirSync(target);
  writeFileSync(join(target, 'SKILL.md'), 'old body\n');
  mkdirSync(`${target}.optimized`);
  writeFileSync(join(`${target}.optimized`, 'SKILL.md'), 'new body\n');
  apply(target);
  rmSync(target, { recursive: true });
  const r = undo(target);
  assert.equal(r.optimized, null);
  assert.equal(readFileSync(join(target, 'SKILL.md'), 'utf8'), 'old body\n');
  assert.ok(!existsSync(`${target}.before`));
  assert.ok(!existsSync(`${target}.optimized`), 'no empty optimized folder is left behind');
  assert.throws(() => undo(target), Refusal);
});

test('undo of a single-file target that has gone missing restores from .before', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'c5o-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const target = join(root, 'reader.md');
  writeFileSync(target, 'old agent\n');
  mkdirSync(`${target}.optimized`);
  writeFileSync(join(`${target}.optimized`, 'reader.md'), 'new agent\n');
  writeFileSync(join(`${target}.optimized`, 'CHANGES.md'), '- del: "old agent"\n');
  apply(target);
  rmSync(target);
  const r = undo(target);
  assert.equal(r.optimized, `${target}.optimized`);
  assert.equal(readFileSync(target, 'utf8'), 'old agent\n');
  assert.ok(statSync(target).isFile(), 'the original comes back as a file, not a folder');
  assert.ok(existsSync(join(`${target}.optimized`, 'CHANGES.md')));
  assert.ok(!existsSync(`${target}.before`));
  assert.throws(() => undo(target), Refusal);
});

test('undo follows the .before layout, not the applied target', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'c5o-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const target = join(root, 'reader.md');
  writeFileSync(target, 'old agent\n');
  mkdirSync(`${target}.optimized`);
  writeFileSync(join(`${target}.optimized`, 'reader.md'), 'new agent\n');
  writeFileSync(join(`${target}.optimized`, 'CHANGES.md'), '- del: "old agent"\n');
  apply(target);
  undo(target);
  assert.equal(readFileSync(target, 'utf8'), 'old agent\n');
  assert.equal(readFileSync(join(`${target}.optimized`, 'reader.md'), 'utf8'), 'new agent\n');
});

test('a folder swap that fails on the second move puts the original back', (t) => {
  const { root, target } = skillFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  let calls = 0;
  const rename = (from, to) => {
    if (++calls === 2) throw new Error('boom');
    renameSync(from, to);
  };
  assert.throws(() => apply(target, { rename }), /boom/);
  assert.equal(readFileSync(join(target, 'SKILL.md'), 'utf8'), 'old body\n');
  assert.ok(!existsSync(`${target}.before`), 'nothing is left at .before');
  assert.ok(existsSync(`${target}.optimized`), 'the optimized copy is untouched');
});

test('a single-file swap that fails on the second move puts the original back', (t) => {
  const { root, target } = agentFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  let calls = 0;
  const rename = (from, to) => {
    if (++calls === 2) throw new Error('boom');
    renameSync(from, to);
  };
  assert.throws(() => apply(target, { rename }), /boom/);
  assert.equal(readFileSync(target, 'utf8'), 'old agent\n');
  assert.ok(!existsSync(`${target}.before`), 'nothing is left at .before');
  assert.ok(existsSync(`${target}.optimized`), 'the optimized copy is untouched');
});
