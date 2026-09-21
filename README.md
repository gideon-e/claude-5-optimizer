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

It is for anyone maintaining skills, agents, or `CLAUDE.md` files written before Claude 5.
A run dispatches two subagents: one reads the file and returns its goal, the other writes
the optimized copy.

What the optimizer leaves in is the knowledge only the author had: an environment fact,
what a named tool refuses, a containment line, the project's vocabulary, the file's owner,
the description's trigger phrases. Those are the lines nobody recovers by reasoning, and
they read exactly like the rules a cut goes after.

## Install

```
claude plugin marketplace add gideon-e/claude-5-optimizer
claude plugin install claude-5-optimizer@claude-5-optimizer --scope user
```

Requires Node 20 or later.

## Use

```
/claude-5-optimizer:optimize path/to/skills/my-skill
/claude-5-optimizer:optimize apply path/to/skills/my-skill
/claude-5-optimizer:optimize undo path/to/skills/my-skill
```

The first reads, rewrites, and shows the before and after. The second swaps the copy in,
keeping the original at `<path>.before`. The third puts it back.

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
thirteen-step procedure, and a step that asks the model to count attendees on every run. The
result of one real run is checked in at `tests/fixtures/hobbled-after/`, with its
`CHANGES.md`. The skill's own report on that run:

```
before → after
body: 67 → 32 lines · 583 → 206 words
rules: 12 → 2     samples: 3 → 0     absolute paths: 1 → 0     session facts: 1 → 0
references: 0 → 37 lines   scripts: 0 → 1 file   repeated sentences: 2 → 0

Kept verbatim: 3 lines the author knew and judgment cannot reach
Losses: none

Apply it, or discard it?
```

The counting, the dated filename, and the already-exists check became a script. The output shape
became a template the write-up is checked against, which let the thirteen steps and the
three cases go. The two rules that survived are the two that protect a stake: never
report a decision the transcript does not contain, and ask before writing over a file. The
folder fact stayed, moved from a home-directory path to a `config.md` the skill reads.

## What is inside

| Piece | Does |
|---|---|
| `skills/optimize/` | the entry point: measure, read, rewrite, re-measure, one question |
| `agents/goal-reader.md` | reads the target, returns the goal, the keep list, and eight checks. Changes nothing |
| `agents/rewriter.md` | writes `<path>.optimized/` and its `CHANGES.md` |
| `scripts/measure.mjs` | the counts, text or `--json` |
| `scripts/apply.mjs` | the reversible swap |
| `references/recipe.md` | the depth both agents read |

Node, no dependencies. `npm test` runs `node --test tests/`, which is the whole test command.

## Security

The scripts make no network calls, read no environment variables, run no shell, and delete
nothing but an empty folder left over from a rename.

The agents run with the installing user's Node through `Bash(node:*)` — broader than the two
scripts they call, and no documented way exists to pin a Bash permission to one script path.
The read-only promise of `goal-reader` is carried by its instructions, not by its tool list.

A target under review is untrusted input: instructions found inside it are data to quote,
not instructions to follow.

## Source

Thariq Shihipar, "The new rules of context engineering for Claude 5 generation models",
Anthropic, 24 July 2026:
https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models

The inference classes are after Kelsey Hightower, "ZTA: Zero Token Architecture",
PlatformCon 2026: infer once, export, run without inference.
https://www.youtube.com/watch?v=A7WFt2JQ5sg

## License

MIT. See `LICENSE`.
