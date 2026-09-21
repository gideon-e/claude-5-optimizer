# The write-up shape

Three blocks, in this order. Everything is drawn from the transcript; nothing is invented.

```markdown
# <topic> — <YYYY-MM-DD>

## Attendees (<count>)
- <full name>
- <full name>

## Decisions
1. <decision, as reached, earliest first>
2. <decision>

## Follow-ups
| What | Owner | By |
|---|---|---|
| <action> | <name, or "unassigned"> | <date, or "no date given"> |
```

## Fields

| Field | Values |
|---|---|
| count | integer; every attendee, including anyone named as present who never spoke, and anyone who joined late |
| decisions | ordered numbered lines; when the meeting reached none, the block reads `No decisions were reached.` |
| owner | a name from the transcript, or `unassigned` — never a guess |
| by | a date stated in the transcript, or `no date given` |

## Checklist before saving

- [ ] Every attendee named in the transcript appears once, and the count matches the list.
- [ ] Every decision is traceable to a passage in the transcript.
- [ ] Every follow-up has an owner field and a by field, filled or explicitly empty.
- [ ] Side conversations, jokes, and small talk are absent.
- [ ] The filename is `YYYY-MM-DD-topic.md`, lower case, no spaces.
