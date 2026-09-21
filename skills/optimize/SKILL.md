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

# /claude-5-optimizer:optimize

## The outcome

The user hands you a file written for a pre-Claude-5 model. They get back a measured
before-and-after and an optimized copy beside the original, untouched, ready to swap in —
and one question: apply it, or discard it. Compute what can be computed, infer the rest.

## The tools

| Tool | What it gives you |
|---|---|
| `node ${CLAUDE_PLUGIN_ROOT}/scripts/measure.mjs <path>` | the counts: body, description, rules, samples, references, scripts, absolute paths, session facts, repeats, computable steps. `--diff <other>` prints the before → after block. `--json`: agents parse, people read |
| Agent `claude-5-optimizer:goal-reader` | what the file was for, the lines only its author knew, the eight hobble checks with a quote per fail, what to cut first |
| Agent `claude-5-optimizer:rewriter` | `<path>.optimized/` and its `CHANGES.md`, plus the rationale and the new counts |
| `node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs <path>` | the swap: original to `<path>.before`, optimized copy into place. `--undo` reverses it |
| `${CLAUDE_PLUGIN_ROOT}/references/recipe.md` | the depth behind all of it; the agents load it themselves |

Each agent starts with a clean window and sees nothing of this session. Paste the target
path and the measure output into the reader's prompt; paste those and the reader's whole
report into the rewriter's. A summary of the report costs the rewrite the keep list.

`optimize apply <path>` and `optimize undo <path>` are the other two entry points: run the
script from the table and report what moved where. The original is kept either way.

## Stakes

Nothing here edits the file the user pointed at. The rewrite lands in a sibling folder, and
applying it is a separate command the user asks for. That is what lets both agents cut
hard.

The failure worth guarding is quiet: a rewrite that scores clean and has thrown away the
sentence saying a server refuses to write into a folder that is not there. The reader's keep
list catches it; carry it into the rewriter's prompt verbatim.

## What the user sees

The before-and-after block is measured, not assembled:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/measure.mjs <path> --diff <path>.optimized
```

Under what it prints:

```
Computed: <n> steps now run as code. Inferred: <n> steps the model still does, each named.
Kept verbatim: <n> lines the author knew and judgment cannot reach
Cut: <one line naming the largest cuts>
Losses: none | <what the cut-loss check restored>

optimized: <path>.optimized   changes: <path>.optimized/CHANGES.md

Apply it, or discard it?
```

Then stop. The decision is the user's, and it is the only question you ask.
