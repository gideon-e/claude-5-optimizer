# The recipe

## The idea

Claude 5 models are hobbled by too much context, not too little. Every rule, worked
example, and repeated warning narrows what the model considers before it has seen the
request. Anthropic cut over 80% of Claude Code's own system prompt for these models with no
measured loss ([Shihipar, 24 July 2026](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)).

So a skill's job is to hand over what only its author knew, then get out of the way.

## What to cut

| Old habit | Replace with |
|---|---|
| Rules | The outcome wanted. A rule stays only if it guards money, an irreversible write, confidentiality, or reputation |
| Worked examples | An interface: parameters, a schema, a file shape |
| Everything upfront | A short body; depth in `references/`, loaded when needed |
| Saying it twice | Once, closest to where it is used |
| Numbered steps | Goal, tools, stakes, output shape. The model sequences |
| Session facts, home paths | Nothing, or a config file. A fresh session on another machine runs it |
| Prose specs | Something the output can be checked against: a test, rubric, template |

## What to keep

Facts about a particular world. Judgment cannot reach them, and they look exactly like the
rules a cut goes after. Keep them word for word:

- **environment**: versions, path conventions, required dependencies
- **tool behaviour**: what a named tool refuses or requires
- **containment**: what has to stay out of an output
- **vocabulary**: names that mean something here
- **owner**: who maintains the file
- **trigger**: the description's use-when and do-not-trigger phrases

## Compute or infer

After [Hightower, "Zero Token Architecture"](https://www.youtube.com/watch?v=A7WFt2JQ5sg):
infer once, export, run without inference. Counting, dating, renaming, checking a file
exists, looking up a fixed table: that is code, written once. The model keeps only the
steps that need judgment, and each one can be named.

## The test

A rewrite should be shorter, run from its files alone, and end with the one decision only
the user can make. For each part, say what breaks without it. If nothing does, it goes.
