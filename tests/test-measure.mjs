import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { measure, renderDiff, countRules, countExamples, countComputableSteps, repeatedSentences, detectKind, description, splitHeader, Refusal } from '../scripts/measure.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = join(root, 'tests/fixtures/hobbled');

test('the hobbled fixture measures as the spec describes it', () => {
  const m = measure(fixture);
  assert.equal(m.kind, 'skill');
  assert.equal(m.rules.total, 12);
  assert.deepEqual([m.rules.must, m.rules.never, m.rules.always], [7, 4, 1]);
  assert.equal(m.examples, 3);
  assert.equal(m.absolutePaths.count, 1);
  assert.deepEqual(m.absolutePaths.samples, ['/Users/jane/notes']);
  assert.equal(m.sessionFacts.count, 1);
  assert.equal(m.repeatedSentences, 2);
  // Five steps open with a computable verb, past "You" and the rule word: rules 2 (list),
  // 3 (count) and 10 (save), and procedure steps 5 (count) and 13 (save). Procedure step 12
  // opens with "The" and uses count as a noun, so it does not.
  assert.equal(m.computableSteps, 5);
  assert.equal(m.references.lines, 0);
  assert.equal(m.scripts.files, 0);
  assert.ok(m.body.words > 400 && m.description.chars > 0);
});

test('kind comes from the path', () => {
  assert.equal(detectKind(fixture), 'skill');
  assert.equal(detectKind('agents/goal-reader.md'), 'agent');
  assert.equal(detectKind('some/where/CLAUDE.md'), 'claudemd');
});

test('rule words count once per line, whole words only', () => {
  const r = countRules('You MUST stop.\nmustard is fine\nNEVER and ALWAYS on one line\ndo not shout\n');
  assert.equal(r.total, 3);
  assert.equal(r.must, 1);
  assert.equal(r.never, 1);
  assert.equal(r.always, 1);
});

test('illustrations count from headings, e.g. lines, and transcript fences', () => {
  const body = '## Example 1\nsome prose\ne.g. this one\n```transcript\nuser: hi\n```\n```js\nconst Example = 1;\n```\n';
  assert.equal(countExamples(body), 3);
});

test('a step counts when a computable verb opens it, through a bold marker', () => {
  assert.equal(countComputableSteps('1. Count the attendees\n'), 1);
  assert.equal(countComputableSteps('- **Count** the attendees\n'), 1);
  assert.equal(countComputableSteps('2. **Look up** the code in the table\n'), 1);
  assert.equal(countComputableSteps('3. You MUST count the attendees yourself\n'), 1);
  assert.equal(countComputableSteps('- you should save the file\n'), 1);
  assert.equal(countComputableSteps('1. Open the transcript file.\n'), 0);
  assert.equal(countComputableSteps('1. You MUST read the entire transcript\n'), 0);
});

test('the verb has to open the step, and code fences are not steps', () => {
  assert.equal(countComputableSteps('- The count matters to Jane.\n'), 0);
  assert.equal(countComputableSteps('Count the attendees yourself.\n'), 0);
  assert.equal(countComputableSteps('- counting is not the verb\n'), 0);
  assert.equal(countComputableSteps('```\n- sort the rows\n```\n'), 0);
});

test('a sentence of eight or more words counts when it appears twice', () => {
  const s = 'Every set of notes ends with a list of decisions.';
  assert.equal(repeatedSentences([`${s} ${s}`]), 1);
  assert.equal(repeatedSentences([s, s]), 1);
  assert.equal(repeatedSentences([s]), 0);
  assert.equal(repeatedSentences(['Too short to count here. Too short to count here.']), 0);
});

test('header splits off and the description is read from it', () => {
  const { header, body } = splitHeader('---\nname: a\ndescription: two words\n---\nbody line\n');
  assert.equal(description(header), 'two words');
  assert.equal(body.trim(), 'body line');
});

test('a folded description is read whole, and stops at the next key', () => {
  const fm = 'name: a\ndescription: >\n  one line\n  and another\nargument-hint: "[path]"';
  assert.equal(description(fm), 'one line and another');
});

test("the plugin's own three bodies stay inside their budgets", () => {
  for (const p of ['skills/optimize', 'agents/goal-reader.md', 'agents/rewriter.md']) {
    const m = measure(join(root, p));
    assert.ok(m.rules.total <= 2, `${p} carries ${m.rules.total} rules`);
    assert.equal(m.examples, 0, `${p} carries ${m.examples} worked cases`);
    assert.equal(m.absolutePaths.count, 0, `${p} carries an absolute path`);
    assert.equal(m.sessionFacts.count, 0, `${p} carries a session fact`);
    assert.ok(m.description.chars < 400, `${p} description is ${m.description.chars} chars`);
    assert.ok(m.body.lines < 100, `${p} body is ${m.body.lines} lines`);
  }
});

test('the command line prints text and --json prints the same object', () => {
  const script = join(root, 'scripts/measure.mjs');
  const text = execFileSync('node', [script, fixture], { encoding: 'utf8' });
  assert.match(text, /rules: 12 \(MUST 7, NEVER 4, ALWAYS 1\)/);
  assert.match(text, /repeated sentences: 2   computable steps: 5/);
  const json = JSON.parse(execFileSync('node', [script, fixture, '--json'], { encoding: 'utf8' }));
  assert.equal(json.rules.total, 12);
  assert.equal(json.computableSteps, 5);
  assert.equal(json.kind, 'skill');
});

test('a folder holding one agent .md beside CHANGES.md is measured as that agent', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'c5o-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const folder = join(dir, 'reader.md.optimized');
  mkdirSync(folder);
  writeFileSync(join(folder, 'reader.md'), '---\nname: reader\ndescription: reads\n---\nbody line\n');
  writeFileSync(join(folder, 'CHANGES.md'), '- del: "old"\n');
  assert.equal(detectKind(folder), 'agent');
  const m = measure(folder);
  assert.equal(m.kind, 'agent');
  assert.equal(m.body.lines, 1);
});

test('a folder holding one CLAUDE.md beside CHANGES.md is measured as a CLAUDE.md', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'c5o-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const folder = join(dir, 'CLAUDE.md.optimized');
  mkdirSync(folder);
  writeFileSync(join(folder, 'CLAUDE.md'), 'a body line\n');
  writeFileSync(join(folder, 'CHANGES.md'), '- del: "old"\n');
  assert.equal(detectKind(folder), 'claudemd');
  assert.equal(measure(folder).kind, 'claudemd');
});

test('a folder with no SKILL.md and no single .md is a one-line refusal, not a stack trace', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'c5o-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const folder = join(dir, 'muddle');
  mkdirSync(folder);
  writeFileSync(join(folder, 'one.md'), 'a\n');
  writeFileSync(join(folder, 'two.md'), 'b\n');
  assert.throws(() => measure(folder), Refusal);
  const r = spawnSync('node', [join(root, 'scripts/measure.mjs'), folder], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /refused/);
  assert.ok(r.stderr.includes(folder), 'the refusal names the folder');
  assert.equal(r.stderr.trim().split('\n').length, 1);
  assert.doesNotMatch(r.stderr, /at .*measure\.mjs/);
});

test('the command line runs from a folder whose name holds a # character', (t) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'c5o-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const odd = join(dir, 'c#5o');
  mkdirSync(odd);
  const script = join(odd, 'measure.mjs');
  copyFileSync(join(root, 'scripts/measure.mjs'), script);
  const out = execFileSync('node', [script, fixture], { encoding: 'utf8' });
  assert.match(out, /rules: 12 \(MUST 7, NEVER 4, ALWAYS 1\)/);
});

test('--diff prints the before to after block the skill reports', () => {
  const script = join(root, 'scripts/measure.mjs');
  const after = join(root, 'tests/fixtures/hobbled-after');
  const out = execFileSync('node', [script, fixture, '--diff', after], { encoding: 'utf8' });
  const lines = out.trimEnd().split('\n');
  assert.equal(lines[0], `target: ${fixture}   kind: skill`);
  assert.equal(lines[1], '');
  assert.equal(lines[2], 'before \u2192 after');
  assert.equal(lines[3], 'body: 67 \u2192 32 lines \u00b7 583 \u2192 206 words');
  assert.equal(lines[4], 'rules: 12 \u2192 2     samples: 3 \u2192 0     absolute paths: 1 \u2192 0     session facts: 1 \u2192 0');
  assert.equal(lines[5], 'references: 0 \u2192 37 lines   scripts: 0 \u2192 1 file   repeated sentences: 2 \u2192 0   computable steps: 5 \u2192 0');
  assert.equal(lines.length, 6);
});

test('--diff --json gives both measurements, not a rendered block', () => {
  const script = join(root, 'scripts/measure.mjs');
  const after = join(root, 'tests/fixtures/hobbled-after');
  const j = JSON.parse(execFileSync('node', [script, fixture, '--diff', after, '--json'], { encoding: 'utf8' }));
  assert.equal(j.before.rules.total, 12);
  assert.equal(j.after.rules.total, 2);
  assert.equal(j.after.scripts.files, 1);
});

test('--diff with no second path is a usage error, and scripts pluralize', () => {
  const r = spawnSync('node', [join(root, 'scripts/measure.mjs'), fixture, '--diff'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--diff <other>/);
  const m = measure(fixture);
  assert.match(renderDiff(m, { ...m, scripts: { files: 2 } }), /scripts: 0 \u2192 2 files/);
});

test('an empty body is zero lines, not one', () => {
  const { body } = splitHeader('---\nname: a\ndescription: b\n---\n');
  assert.equal(body, '');
  const dir = mkdtempSync(join(tmpdir(), 'c5o-'));
  const folder = join(dir, 'empty');
  mkdirSync(folder);
  writeFileSync(join(folder, 'SKILL.md'), '---\nname: a\ndescription: b\n---\n');
  const m = measure(folder);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(m.body.lines, 0);
  assert.equal(m.body.words, 0);
});

test('a quoted description loses its quotes, not its text', () => {
  assert.equal(description('description: "two words"'), 'two words');
  assert.equal(description("description: 'two words'"), 'two words');
  assert.equal(description('description: two "quoted" words'), 'two "quoted" words');
});
