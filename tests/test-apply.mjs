import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
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
