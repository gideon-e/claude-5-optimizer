import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'));
const market = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'));

test('plugin manifest names the plugin and a semver version', () => {
  assert.equal(plugin.name, 'claude-5-optimizer');
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
  assert.equal(plugin.license, 'MIT');
});

test('marketplace lists the plugin at ./ with the same version', () => {
  const entry = market.plugins.find((p) => p.name === plugin.name);
  assert.ok(entry, 'marketplace has no entry for the plugin');
  assert.equal(entry.source, './');
  assert.equal(entry.version, plugin.version);
});

test('descriptions agree and stay under 400 characters', () => {
  const entry = market.plugins.find((p) => p.name === plugin.name);
  assert.equal(entry.description, plugin.description);
  assert.ok(plugin.description.length < 400, `description is ${plugin.description.length} chars`);
});
