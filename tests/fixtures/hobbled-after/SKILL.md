---
name: meeting-notes
description: Turns a raw meeting transcript into tidy notes with attendees, decisions, and follow-ups. Use when the user says "write up the meeting", "clean up these notes", or "who agreed to what". Do NOT trigger for calendar scheduling or for drafting an agenda before a meeting.
argument-hint: "[path to the transcript]"
user-invocable: true
---

# meeting-notes

One markdown write-up per transcript: who was there, what was decided, what happens next —
saved beside the transcript. Jane reads these on her phone on the way home, so short lines
beat long ones, and a decision she can act on beats a paragraph explaining the discussion.

Output shape, and the checklist the finished file is held against:
[references/notes-template.md](references/notes-template.md). Open it before writing.

## Stakes

- You NEVER summarise a decision that was not actually reached in the meeting. When nothing
  was decided, the decisions block says so.
- You MUST ask the user before saving over a file that is already there.

## Where things live

Jane keeps every transcript and every finished write-up in the folder named in
`config.md`, and the skill reads and writes there. Her filenames are in the shape
`YYYY-MM-DD-topic.md`, in lower case, with no spaces anywhere in the name.

## The count and the filename

Once you have the attendee list and a topic, the count, the filename, and the
already-exists check come from the script, not from you:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/notes-file.mjs --transcript <path> --topic "<topic>" --attendees "Name; Name; Name"
```

It returns JSON: `{ count, filename, path, exists }`. If `exists` is true, ask before writing.
