# The recipe

The depth behind the optimizer. Both agents read it; the agent bodies carry only the shapes.

## 1. The one idea

Claude 5 generation models are hobbled by too much context, not too little. Every rule,
worked transcript, and repeated warning narrows what the model will consider before it has
seen the request. Anthropic cut over 80% of Claude Code's own system prompt for these models
with no measured loss (Thariq Shihipar, "The new rules of context engineering for Claude 5
generation models", 24 July 2026,
https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models).

So the job of a skill, an agent, or a `CLAUDE.md` is to hand the model the knowledge only its
author had, then get out of the way. Everything else in the file is a candidate for deletion.

## 2. Six shifts

| Then | Now | What it looks like in a file |
|---|---|---|
| Give the model rules | Let the model use judgment | Delete prohibitions that guard against a failure the model no longer produces. A rule survives only where it protects a stake: money, an irreversible write, confidentiality, reputation. State the outcome wanted, not the prohibition |
| Give the model samples | Design interfaces | Spend the words on parameters, enumerations, file shapes, and output schemas. A `status: pending, running, done` field teaches more than three transcripts, and does not narrow the exploration space |
| Put it all upfront | Progressive disclosure | The body is the short guide; depth lives in `references/` and loads when the work needs it. A `CLAUDE.md` is a tree of pointers, not a repository of every practice |
| Repeat yourself | Say it once, closest to use | An instruction for a tool lives in that tool's description, not also in the body and the project file. Position in the window no longer buys anything |
| Memory in the file | The model's own memory | Session facts and user preferences do not belong in a committed file; they go stale and they bind every future run |
| Simple specs | Rich references | Give the model code, a test, a rubric, a schema, or a mockup. A reference in a language the model reads natively beats prose describing it |

## 3. The eight checks

Each is pass or fail on one reading, and each fail carries a verbatim quote.

**1. Rules where judgment would do.** Count the lines carrying MUST, NEVER, ALWAYS, "do
not", "don't". Pass when every survivor names the stake it protects and the stake is real.

**2. Samples where an interface would do.** Worked transcripts, "the user says X, you say Y",
long illustrative walk-throughs. Pass when the shape is given as a parameter set, a table, or
a file layout, and any remaining illustration is there because the shape cannot be described.

**3. Everything upfront.** Pass when the body is under its budget (a skill body under about
1,500 words) and anything needed only sometimes sits in `references/` behind a one-line
pointer that says when to open it.

**4. Said twice.** Pass when nothing appears in two of: the description, the body, the
references, the project file, a tool description. One copy, in the place closest to use.

**5. Steps narrated where a goal and tools would do.** A numbered script of more than about
three steps is the signal. Pass when the file states the outcome, the tools, the stakes, and
the shape of the output, and leaves the sequencing to the model.

**6. A repeated step that calls the model.** Anything that counts, sorts, renames, copies,
compares, formats, or date-stamps on every run. Pass when that step ships as a script or a
data file (§5 below).

**7. No reference the output can be checked against.** Pass when a file that produces a
document, a design, or code also names a rubric, a schema, a test, or a mockup the result is
checked against.

**8. Tied to one machine or one session.** Absolute paths, a home directory, a sync-folder
name, "remember that", "the user prefers", "last time". Pass when a fresh session on another
machine can run the thing from the files alone.

## 4. The keep list

The one place precision still beats judgment. These are the lines nobody recovers by
reasoning, because they are facts about a particular world, and they read exactly like the
enumerated failure modes a cut goes after. Each is kept verbatim.

| Kind | Why judgment cannot reach it |
|---|---|
| environment | An interpreter version, a path convention, an env var, a dependency that has to be present. The model cannot see the machine |
| tool behaviour | What a named tool or server does, refuses, or requires — a write that fails on a folder that is not there, a paging limit, a key needed before a search |
| containment | What has to stay out of a file, an output, or a session. The cost of guessing wrong is not recoverable |
| vocabulary | A name, label, prefix, or convention that means something particular in this project |
| owner | Who maintains the file and when it is read again. A file that belongs to nobody rots |
| trigger | The description's use-when and do-not-trigger phrases. Routing is decided on the description alone |

A reader that empties this list to make the rewrite shorter has failed.

## 5. The four inference classes

After Kelsey Hightower, PlatformCon 2026: infer once, export, run without inference.
Classify every place the design calls the model.

| Class | Signal | What ships |
|---|---|---|
| Build | The model is creating something new: a script, a query, a mapping, a template | The model runs once, at build time; the artifact goes in the repo |
| Loop | The same shape of request every run, every session, every file | Deterministic code or a data file. No model call |
| Judgment | Unstructured input: prose to classify, a draft to write, a case the code cannot foresee | The model at run time, on that step only |
| Change | The loop's shape moved and the exported artifact no longer fits | Infer once more, re-export, back to Loop |

"The model can figure it out" on a repeated step is the failure this class list is about.
Export means whatever a human can read and fix: a script, a reference file the code reads, a
fixed prompt with parameters, a cached result with a key.

## 6. Design tests a rewrite passes

- State lives on disk, not in a head and not in a session. What the model needs at a decision
  sits in a file it can read, with its source.
- A fresh session with no memory runs the thing from the files alone.
- The tool ends with the one decision only the user can make. Everything else it decides.
- The simplest system that meets the goal wins. For each part, say what breaks without it; if
  nothing breaks, it goes.
- It degrades to files, never to nothing. A missing connector or server leaves a path that
  still works.
- Cut before adding. A rewrite that ends longer than the original has gone the wrong way.
