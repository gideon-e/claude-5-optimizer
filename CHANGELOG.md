# Changelog

All notable changes to this plugin are recorded here. Versions follow semver.

## 0.2.0 — 2026-09-21

- `references/recipe.md`: check 6 is the compute-or-infer test — compute what can be
  computed, infer the rest — with the signal list of work code does that authors hand to the
  model anyway.
- `agents/goal-reader.md`: a `Steps` table, one row per step the target asks the model to
  perform, marked Compute or Infer with what ships. Check 6's row points at it.
- `agents/rewriter.md`: the Steps table is the script list, and the report ends with how many
  steps now run as code and how many judgments are left.
- `scripts/measure.mjs`: a `computable steps` count, exported as `COMPUTABLE_VERBS`, in the
  text output, `--json`, and `--diff`. An opening "You" and a rule word are skipped, so
  "You MUST count the attendees" counts as the step it is.
- `skills/optimize`: the Computed/Inferred line under the measured block.
- `README.md`: the fixture numbers include the new count.

## 0.1.2 — 2026-09-21

- `skills/optimize`: an `undo` verb beside `apply`, and the before → after block comes from
  the script instead of being assembled by hand.
- `scripts/measure.mjs`: `--diff <other>` prints the before → after block, text or `--json`.
- `scripts/measure.mjs`: an empty body counts 0 lines, and a quoted YAML description loses
  its quotes.
- `scripts/apply.mjs`: a folder swap that fails on the second move puts the original back.
- `agents/rewriter.md`: the five shifts it restated from `references/recipe.md` are gone,
  along with `Edit`, `Bash(wc:*)`, and `Bash(mkdir:*)`.
- `agents/goal-reader.md`: `Bash(wc:*)` gone; the counts come from `measure.mjs`.
- `references/recipe.md`: the Kelsey Hightower talk is linked.
- `package.json`: name, version, and `npm test`. A test holds it to the plugin version.
- `.github/workflows/test.yml`: the privacy gate excludes the fixture's invented
  `/Users/jane` path by name, so it is green without excluding whole files.
- `README.md`: the install line takes the marketplace, the fixture numbers are the measured
  ones, and the Why says who it is for.
- `tests/fixtures/hobbled-after`: `CHANGES.md` cut from 665 words to under 300, and the
  script call carries `${CLAUDE_PLUGIN_ROOT}`.

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
