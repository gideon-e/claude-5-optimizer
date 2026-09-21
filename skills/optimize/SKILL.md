---
name: optimize
description: >
  Rewrites a skill, agent, or CLAUDE.md written for an older model so it serves its goal
  without hobbling Claude 5. Use on "optimize this skill for Claude 5", "unhobble this
  skill", "refactor this agent for the new models", "is this CLAUDE.md hobbling Claude",
  "claude-5-optimizer". Do NOT trigger for writing a new skill from scratch (skill-creator)
  or reviewing code (code-review).
argument-hint: "[path to a skill folder, an agent .md, or a CLAUDE.md] | apply [path] | undo [path]"
user-invocable: true
---

# /claude-5-optimizer:optimize

## The outcome

The user hands you a file written for a pre-Claude-5 model. They get back a measured
before-and-after and an optimized copy sitting beside the original, untouched, ready to
swap in — and one question: apply it, or discard it.

## The tools

| Tool | What it gives you |
|---|---|
| `node ${CLAUDE_PLUGIN_ROOT}/scripts/measure.mjs <path>` | the counts: body, description, rules, samples, references, scripts, absolute paths, session facts, repeats. `--json` for an agent |
| Agent `claude-5-optimizer:goal-reader` | what the file was for, the lines only its author knew, the eight hobble checks with a quote per fail, what to cut first |
| Agent `claude-5-optimizer:rewriter` | `<path>.optimized/` and its `CHANGES.md`, plus the rationale and the new counts |
| `node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs <path>` | the swap: original to `<path>.before`, optimized copy into place. `--undo` reverses it |
| `${CLAUDE_PLUGIN_ROOT}/references/recipe.md` | the depth behind all of it; the agents load it themselves |

Each agent starts with a clean window and can see nothing of this session. Paste into the
reader's prompt the target path and the measure output; paste into the rewriter's prompt the
target path, the measure output, and the reader's report whole. A summary of the report
costs the rewrite the keep list.

`optimize apply <path>` and `optimize undo <path>` are the other two entry points. Run
`node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs <path>`, or the same line with `--undo`, and
report what moved where. The original is kept either way.

## Stakes

Nothing here edits the file the user pointed at. The rewrite lands in a sibling folder, and
applying it is a separate command the user asks for. That is what lets the reader and the
rewriter cut hard.

The failure worth guarding is a quiet one: a rewrite that scores clean and has thrown away
the sentence saying a server refuses to write into a folder that is not there. The reader's
keep list is how that is caught; carry it into the rewriter's prompt verbatim.

## What the user sees

```
target: <path>   kind: skill

before → after
body: 214 → 71 lines · 1,571 → 480 words
rules: 12 → 1     samples: 3 → 0     absolute paths: 1 → 0     session facts: 1 → 0
references: 0 → 96 lines   scripts: 0 → 1 file

Kept verbatim: <n> lines the author knew and judgment cannot reach
Cut: <one line naming the largest cuts>
Losses: none | <what the cut-loss check restored>

optimized: <path>.optimized   changes: <path>.optimized/CHANGES.md

Apply it, or discard it?
```

Then stop. The before-and-after is the report; the decision is the user's, and it is the
only question you ask.
