# claude-5-optimizer

A Claude Code plugin that does one thing. It reads a skill, an agent, or a `CLAUDE.md`
written for a pre-Claude-5 model, works out what its author wanted the file to achieve, and
writes an optimized copy beside it. The original is left where it is; applying the copy is a
separate command, and it is reversible.

## Why

Claude 5 generation models are hobbled by too much context, not too little. Anthropic cut
over 80% of Claude Code's own system prompt for these models with no measured loss. Most
skills in the wild were written before that: numbered workflows, worked transcripts,
MUST/NEVER lists, everything loaded upfront, absolute paths, session facts baked into the
file. Each of those narrows what the model will consider before it has seen the request.

What the optimizer will not take out is the knowledge only the author had — an environment
fact, what a named tool refuses, a containment line, a project's own vocabulary, who owns
the file, and the description's trigger phrases. Those are the lines nobody recovers by
reasoning, and they read exactly like the rules a cut goes after.

## Install

```
claude plugin marketplace add gideon-e/claude-5-optimizer
claude plugin install claude-5-optimizer --scope user
```

## Use

```
/claude-5-optimizer:optimize path/to/skills/my-skill
/claude-5-optimizer:optimize apply path/to/skills/my-skill
```

The first reads, rewrites, and shows the before and after. The second swaps the copy in,
keeping the original at `<path>.before`; `node scripts/apply.mjs <path> --undo` puts it back.

## A run on the bundled fixture

`tests/fixtures/hobbled/` is an invented `meeting-notes` skill, written in the old style for
an imaginary user. Measured:

```
$ node scripts/measure.mjs tests/fixtures/hobbled
target: tests/fixtures/hobbled   kind: skill
body: 67 lines · 583 words     description: 268 chars
rules: 12 (MUST 7, NEVER 4, ALWAYS 1)   examples: 3
references: 0 lines   scripts: 0 files
absolute paths: 1 (/Users/jane/notes)   session facts: 1 (remember that)
repeated sentences: 2
```

Twelve rules, three worked cases, a home-directory path, a preference baked into the file, a
thirteen-step procedure, and a step that asks the model to count attendees on every run. A
run ends with a report in this shape, and one question:

```
before → after
body: 67 → 24 lines · 583 → 210 words
rules: 12 → 1     samples: 3 → 0     absolute paths: 1 → 0     session facts: 1 → 0
references: 0 → 40 lines   scripts: 0 → 1 file

Kept verbatim: 2 lines the author knew and judgment cannot reach
optimized: tests/fixtures/hobbled.optimized

Apply it, or discard it?
```

The counting step becomes a script, the filename convention stays because it is the project's
own vocabulary, and the twelve rules become the one that protects a stake — the check before
writing over a file that is already there.

## What is inside

| Piece | Does |
|---|---|
| `skills/optimize/` | the entry point: measure, read, rewrite, re-measure, one question |
| `agents/goal-reader.md` | reads the target, returns the goal, the keep list, and eight checks. Changes nothing |
| `agents/rewriter.md` | writes `<path>.optimized/` and its `CHANGES.md` |
| `scripts/measure.mjs` | the counts, text or `--json` |
| `scripts/apply.mjs` | the reversible swap |
| `references/recipe.md` | the depth both agents read |

Node, no dependencies. `node --test tests/` is the whole test command.

## Source

Thariq Shihipar, "The new rules of context engineering for Claude 5 generation models",
Anthropic, 24 July 2026:
https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models

The inference classes are after Kelsey Hightower, PlatformCon 2026: infer once, export, run
without inference.

## License

MIT. See `LICENSE`.
