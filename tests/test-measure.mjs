import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { measure, countRules, countExamples, repeatedSentences, detectKind, description, splitHeader } from '../scripts/measure.mjs';

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
  const json = JSON.parse(execFileSync('node', [script, fixture, '--json'], { encoding: 'utf8' }));
  assert.equal(json.rules.total, 12);
  assert.equal(json.kind, 'skill');
});
