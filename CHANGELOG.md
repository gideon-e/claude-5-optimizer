# Changelog

Semver. Detail is in the git history.

## Unreleased

- Skill, recipe, agents, README, and this file cut to about a third. Same behaviour.

## 0.2.1 — 2026-09-21

Fixes from two review passes.

- `apply.mjs`: a failed single-file swap restores the original.
- `measure.mjs`: text inside code fences no longer counts as rules or steps; repeated
  session facts each count; hidden and editor files are skipped; symlink cycles are cut.
- CI runs on Node 20, 22, and 24 behind one required `test` check.

## 0.2.0 — 2026-09-21

- Compute or infer: the reader marks each step as code or judgment, the rewriter ships the
  code, and `measure.mjs` counts computable steps.

## 0.1.2 — 2026-09-21

- `undo` beside `apply`; `measure.mjs --diff` prints before → after.
- A failed folder swap restores the original.

## 0.1.1 — 2026-09-21

- Clearer refusals for targets that are not a skill, agent, or `CLAUDE.md`.
- Security section in the README.

## 0.1.0 — 2026-09-21

First release: the optimize skill, the goal reader and rewriter agents, `measure.mjs`,
`apply.mjs`, and the recipe.
