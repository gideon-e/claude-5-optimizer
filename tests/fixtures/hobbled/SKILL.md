---
name: meeting-notes
description: Turns a raw meeting transcript into tidy notes with attendees, decisions, and follow-ups. Use when the user says "write up the meeting", "clean up these notes", or "who agreed to what". Do NOT trigger for calendar scheduling or for drafting an agenda before a meeting.
argument-hint: "[path to the transcript]"
user-invocable: true
---

# meeting-notes

A skill that writes up a meeting from a raw transcript. Written in 2025 for the older models,
kept here as the fixture the optimizer is tested against. Everyone in it is invented.

## Rules

1. You MUST read the entire transcript before writing anything at all.
2. You MUST list every attendee by full name at the top of the write-up.
3. You MUST count the attendees yourself and write the number beside the list.
4. You NEVER summarise a decision that was not actually reached in the meeting.
5. You MUST put the decisions in the order they were reached, earliest first.
6. You NEVER use bullet points inside the decisions section, only numbered lines.
7. You MUST give every follow-up an owner, even when the owner is unclear.
8. You NEVER write more than ten follow-ups, however long the meeting ran.
9. You MUST write the notes in past tense throughout.
10. You ALWAYS save the finished notes as a markdown file beside the transcript.
11. You NEVER include side conversations, jokes, or small talk in the write-up.
12. You MUST ask the user before saving over a file that is already there.

## Where things live

Jane keeps every transcript and every finished write-up in /Users/jane/notes, and the skill
reads and writes there. Please remember that the user prefers her filenames in the shape
`YYYY-MM-DD-topic.md`, in lower case, with no spaces anywhere in the name.

## Procedure

1. Open the transcript file.
2. Read it from the first line to the last line.
3. Make a list of everyone who spoke.
4. Add anyone who was named as present but did not speak.
5. Count the people on that list and hold the number.
6. Re-read the transcript looking only for decisions.
7. Write each decision as one numbered line.
8. Re-read the transcript again looking only for follow-ups.
9. Give each follow-up an owner and a date.
10. Write the attendee block, the decision block, and the follow-up block in that order.
11. Every set of notes ends with a list of decisions and owners.
12. The attendee count is written at the top of the file.
13. Save the file and tell the user where it went.

## Worked cases

### Example 1: the short stand-up

The user says: "write up this morning's stand-up". The transcript has four speakers and runs
about two pages. You read it, you count four attendees, you find one decision (the release
slips a week) and two follow-ups. You write the file and you say where it went.

### Example 2: the long planning session

The user says: "clean up the planning notes". The transcript runs forty pages with eleven
speakers, two of whom join late. You count eleven attendees, not nine, because the two who
joined late still count. Every set of notes ends with a list of decisions and owners.

### Example 3: the call where nothing was decided

The user says: "who agreed to what on the vendor call". Nothing was decided. You still write
the attendee block and the follow-up block, and you write "no decisions were reached" in the
decisions block rather than inventing one. The attendee count is written at the top of the file.

## A note on tone

Keep the write-up plain. Jane reads these on her phone on the way home, so short lines beat
long ones, and a decision she can act on beats a paragraph that explains the discussion.
