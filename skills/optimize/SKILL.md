---
name: optimize
description: >
  Rewrites a skill, agent, or CLAUDE.md written for an older model so it serves its goal
  without hobbling Claude 5. Use on "optimize this skill for Claude 5", "unhobble this
  skill", "refactor this agent for the new models", "is this CLAUDE.md hobbling Claude",
  "claude-5-optimizer". Do NOT trigger for writing a new skill from scratch (skill-creator)
  or reviewing code (code-review).
argument-hint: "[path to a skill folder, an agent .md, or a CLAUDE.md] | apply [path] | undo [path]"
---

# Optimize

A file written for an older model is mostly scaffolding around a few lines only its author
knew. Find those lines, keep them, cut the rest. The idea is in
[recipe.md](../../references/recipe.md).

## Tools

- `node ${CLAUDE_PLUGIN_ROOT}/scripts/measure.mjs <path>` counts what hobbles a file.
  `--diff <other>` prints before → after.
- Agent `claude-5-optimizer:goal-reader` says what the file is for and what to keep.
- Agent `claude-5-optimizer:rewriter` writes `<path>.optimized/` with a `CHANGES.md`.
- `node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs <path>` swaps the copy in; `--undo` puts
  the original back. These are the `apply` and `undo` entry points.

Agents start blank. Give the reader the path and the counts; give the rewriter those and
the reader's whole report, not a summary of it.

## Stakes

The original is never edited, which is what lets the agents cut hard. The quiet failure is
a clean-scoring rewrite that lost a line like "the server refuses to write into a folder
that is not there." The reader's keep list is the guard.

## End

Show the `--diff` output, the losses (or none), the path to the copy, and ask one
question: apply it, or discard it?
