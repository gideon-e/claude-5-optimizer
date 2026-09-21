# Changelog

All notable changes to this plugin are recorded here. Versions follow semver.

## 0.1.1 — 2026-09-21

- `measure.mjs`: a folder counts as a skill only when it holds a `SKILL.md`.
- `measure.mjs`: a folder holding one `.md` beside `CHANGES.md` is measured as that file.
- `measure.mjs`: a folder that is neither is a one-line refusal and exit 1, not a stack trace.
- `apply.mjs`: an optimized copy that is a file, and a `.before` that is a file, are refused.
- `apply.mjs`: undo reads its layout from `.before`, and a missing target just moves it back.
- Both scripts: the run-as-a-command check survives a `#`, `%`, or `?` in the script's path.
- `README.md`: a Security section on what the scripts touch and what `Bash(node:*)` allows.
- `agents/rewriter.md`: the single-file layout `apply.mjs` expects, said once.

## 0.1.0 — 2026-09-21

First release.

- `skills/optimize`: measure, read, rewrite, re-measure, and the one question.
- `agents/goal-reader`: the goal, the keep list, the eight hobble checks.
- `agents/rewriter`: the optimized copy and its `CHANGES.md`.
- `scripts/measure.mjs`: counts for a skill folder, an agent file, or a `CLAUDE.md`.
- `scripts/apply.mjs`: the reversible swap, with `--undo`.
- `references/recipe.md`: the one idea, six shifts, eight checks, keep list, inference classes.
- `tests/fixtures/hobbled`: an invented pre-Claude-5 skill the tests measure.
