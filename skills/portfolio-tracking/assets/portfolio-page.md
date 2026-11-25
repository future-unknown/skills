# Portfolio

The portfolio of {{FUND_NAME}}: every company the fund has invested in, what each has raised, who runs it, what it reports, and what the fund owes it. People and agents both keep it current; the team works from {{SITE_URL}}.

This wiki is restricted to the investment team. Don't share it, copy its records elsewhere, or add people who aren't on the team.

## Tables

- `fund`, `team`: the fund and its people.
- `companies`: one record per portfolio company. The centre of everything else.
- `rounds`: every round a company raised, with `basis` saying how we know: `public`, `company-reported` or `confirmed`.
- `people`: founders, executives and board members at the companies.
- `media`: references to logos and headshots. Known stores the link, not the file.
- `updates`: what companies report (`company-reported`) and our own notes (`fund-note`).
- `tasks`: our to-dos for the companies.
- `signals`, `runs`: what monitoring found, and its runs. See [[monitoring]].

## Before you write

- Read the table's schema (in the page's metadata) and set only declared fields.
- **New record:** read the key first; writing replaces any record with the same key. Task and signal numbers are the highest plus one, comparing numbers.
- **Update:** read the record, change only what changed, and write it back whole with the version you read (`_v`). If refused, read again and redo the change.
- Links between records are wiki links: `[[companies/ferncloud]]`, `[[team/mara-lind]]`.
- Every amount carries its `currency`.

## Rules

- **Claims stay claims.** What a website or a company says is recorded with its source in `source_paths`. Our view goes in a `fund-note` update or the record's content, never over their figures.
- **Don't infer.** No amount, round, ownership, status or departure from silence, a logo, or a photo. Unknown is null.
- **Reported funding is a floor.** Sums of rounds are "at least this much publicly reported", not total raised.
- **Filing an update** (forwarded email, board pack, call): one `updates` record with the metrics as stated, highlights, lowlights and asks in their words. Propose a task per ask. Propose, don't make, changes it implies to companies, people or rounds.
- **People:** public, work-related facts from the fund's or company's own pages only. No personal contact details. Remove anyone who asks: their record, media and links.
- **Nothing is deleted** to show a change: set a company's status, a person's `former` and end date, a task's `done`. Known keeps every version.
