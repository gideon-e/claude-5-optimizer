# claude-5-optimizer

Most skills were written for models that needed hand-holding: MUST/NEVER lists, worked
transcripts, long numbered procedures. Claude 5 does worse with all that. This plugin reads a skill, agent, or `CLAUDE.md`, finds the few lines only its author knew,
and writes a shorter copy beside it that keeps those and cuts the rest. You decide whether
to swap it in. The thinking is in [references/recipe.md](references/recipe.md).

## Install

```
claude plugin marketplace add gideon-e/claude-5-optimizer
claude plugin install claude-5-optimizer@claude-5-optimizer --scope user
```

Node 20 or later.

## Use

```
/claude-5-optimizer:optimize path/to/skill     # measure, read, write a copy
/claude-5-optimizer:optimize apply path/to/skill   # swap it in; original kept at <path>.before
/claude-5-optimizer:optimize undo path/to/skill    # put it back
```

## Example

[`tests/fixtures/hobbled/`](tests/fixtures/hobbled/) is an invented old-style skill;
[`hobbled-after/`](tests/fixtures/hobbled-after/) is one real run on it:

```
body: 67 → 32 lines · 583 → 206 words
rules: 12 → 2   samples: 3 → 0   absolute paths: 1 → 0   session facts: 2 → 0
scripts: 0 → 1   computable steps: 4 → 0
```

The two rules that survived guard a stake: report no decision the transcript lacks, and ask
before overwriting a file.

## Inside

| Piece | Does |
|---|---|
| `skills/optimize/` | the entry point |
| `agents/goal-reader.md` | says what the file is for and what to keep; changes nothing |
| `agents/rewriter.md` | writes `<path>.optimized/` and `CHANGES.md` |
| `scripts/measure.mjs`, `scripts/apply.mjs` | the counts, and the reversible swap |

No dependencies; `npm test` runs `node --test`. What the plugin can reach:
[SECURITY.md](SECURITY.md).

MIT.
