# Portfolio model

One restricted wiki, `portfolio` by default, holds the fund's view of the companies it has invested in. Companies are the centre; everything else hangs off them by wiki links (`[[companies/ferncloud]]`).

| Table | Kind | Key | Owns |
|---|---|---|---|
| `fund` | Current state | slug | The fund as it presents itself; usually one record |
| `team` | Current state | slug | The fund's partners and team |
| `companies` | Current state | slug | Each portfolio company and the fund's relationship to it |
| `rounds` | Dated events | `<company>-<round>` | Every financing round a company raised, not only the fund's |
| `people` | Current state | `<company>-<name>` | Founders, executives and board members of portfolio companies |
| `media` | Current state | `<subject>-<kind>` | References to logos, headshots and other files: never the files themselves |
| `updates` | Dated events | `<company>-<date>-<word>` | What a company reported, and the fund's own notes |
| `tasks` | Current state | `T-<n>` | The fund's to-dos for its companies |
| `signals` | Proposals | `S-<n>` | What monitoring found, waiting for a person to accept or reject |
| `runs` | Dated events | start time | One record per monitoring run |

The pages `portfolio` (the wiki's home, `assets/portfolio-page.md`) and `monitoring` (`assets/monitoring-page.md`) hold the rules people and agents follow.

## Kinds of truth, kept apart

- **What a source says** (the fund's site, a company's site, a press release) is a claim with its URL in `source_paths`. A company listed on a portfolio page is not evidence of an amount, a round or ownership.
- **What a company reports** is an `updates` record with origin `company-reported`. Its metrics are the company's figures, not the fund's.
- **What the fund thinks** is an `updates` record with origin `fund-note`, or the record's `content`. It never overwrites a company's claims.
- **What monitoring found** is a `signals` record until a person accepts it. A signal is not a fact.
- **What the fund knows for certain** is marked on rounds with `basis: confirmed` (it holds the closing documents).

## Companies

Two different questions, two fields:

- `status` is what is true of the **company**: `active`, `acquired`, `ipo`, `shut-down`, `dormant`, or null when no source says. Anything but `active` needs a source that says so, quoted in `exit_note`. Silence is not dormancy.
- `fund_position` is whether the **fund** still holds a stake: `held`, `exited`, or null. Many funds list every company on one page with no live or exited split; then it stays null, and monitoring treats a company that isn't exited, acquired, listed or shut down as one the fund may still hold. A fund can exit a company that stays active (a secondary sale), and an acquisition doesn't by itself say the fund is out. "Exited in 2024" sets `fund_position: exited` and leaves `status` null.

When the fund's site disagrees with itself (a company filed under "live" whose card says "Acquired by X in 2025"), record what each says: the explicit outcome sets `status`, the filing sets `fund_position`, and `exit_note` quotes both. Raise it with the user rather than resolving it.

`fund_stage` keeps the fund's own stage label ("Early", "Growth") when it doesn't map onto `stage`; the site shows it where `stage` and the rounds say nothing. A stage filter value that names an outcome ("Acquired", "Exited") isn't a stage: it is `status` or `fund_position`, as below.

`entry_round` and `first_invested_year` hold what a portfolio page usually states ("Seed in 2015"): the fund's entry, not the company's current stage. Keep `stage` for the company's latest known round and `first_invested_on` for an exact date.

`domain` is the matching key across sources: the website's host without `www`. Two records with one domain are one company; merge them with the user's approval.

The fund's relationship lives here: `lead_partner` (a `team` link), `board_role`, `first_invested_on`, `ownership_percent` with `ownership_as_of`, `vehicles`, and `reporting_cadence`.

A firm with several funds says which holds the company in `vehicles` (a company can sit in more than one: a seed from Fund III, a follow-on from an opportunity fund), and which wrote each cheque in a round's `vehicle`. Both use the names in the `fund` record's `vehicles`, exactly as written there, so they can be matched; add the vehicle to the fund record first when it is missing. Set them only when the fund's site or the team says so: a company's investment year next to a fund's vintage is not evidence. These are confidential to the fund and stay null until someone on the team states them.

`on_fund_site` says whether the fund's portfolio page lists the company now. A company that leaves the page is not thereby exited: monitoring raises a `removed-company` signal and a person decides.

Funds the fund invested in (a fund-of-funds position: "Portfolio Fund" on some sites) are not companies. List them in the fund record's `fund_investments`, not in `companies`.

## Rounds

One record per round a company raised. `amount` is the whole round; `fund_amount` is the fund's part, and `vehicle` the fund's vehicle that paid it, when known. Every record with an amount, valuation or cap carries `currency` (the schema enforces it).

`basis`:

- `public`: a press release, newsroom or website said it.
- `company-reported`: the company told the fund.
- `confirmed`: the fund holds the closing documents.

Debt (credit facilities, loans, lending programmes) and grants are rounds with `instrument` `debt` or `grant`: recorded, never summed into equity raised.

Dates: `announced_on` and `closed_on` only when a source gives the day; otherwise `year`. Never turn a year into a date.

Public rounds are incomplete. Sums of `amount` are "at least this much publicly reported", never "total raised". Do not estimate amounts, valuations or participants. A SAFE has no shares or price until it converts; record the conversion as part of the priced round's content.

## People and team

`team` is the fund's own people, with the companies the fund's site ties to each: `board_positions` and `related_investments`, as the site words them. Company pages and filters derive the fund's people on a company from these; `lead_partner` on a company is set only when a source names a lead.

`people` is the companies' people. `team` and `people` both keep `status` (`current` or `former`) and dates instead of deleting anyone: when someone leaves, set `former` and the end date. Known keeps every version.

Collect only work-related, public facts from the fund's or the company's own pages: name, title, role, bio as written, headshot, and profile links shown on those pages. Never personal email, phone, home location, age or family. Never search other sites to fill a gap, and never fetch a profile link's page.

When relationship management is set up, link a person to their contact with `contact`. Don't create contacts from this skill.

## Media

A media record is a reference: the file's URL, where it was found, alt text, type, size, a SHA-256 fingerprint when the agent can compute one, and when it was fetched. Known does not store the file. Records point at their chosen image with `logo` or `photo`; several media records can exist for one subject, and only the linked one is shown.

`status`: `current`, `broken` (the URL no longer answers), `replaced` (a newer record took its place). Monitoring re-checks URLs and fingerprints and raises signals; it never swaps an image by itself.

Only collect images from the fund's and companies' own sites. Headshots are personal data: keep them as references, and remove the record and the `photo` link when anyone asks.

## Updates

`origin`:

- `press`: a story by an outside publication about the company, as it reported it: the headline, the `publisher`, the date and the link. Monitoring files these daily; a first import can file the last month. Never a claim the fund makes.
- `company-reported`: an investor update, board pack or anything else the company sent. Metrics are its claims as stated. Missing means not stated; zero means stated as zero.
- `fund-note`: the fund's call note, board notes or assessment.

`kind`: `investor-update`, `board-meeting`, `call`, `news`, `milestone`, `other`. `period` is what it reports on (`2026-10`, `2026-Q3`).

Filing a forwarded update: read it, write one `updates` record with the metrics the fund tracks, the highlights, lowlights and asks in the company's words, and the full text summarised in `content`. Propose a task for each ask. Propose, never write, changes it implies for `companies`, `people` or `rounds` (a new hire, a new round).

An update is an event: don't rewrite what a company reported. Correct a mistake in filing with a note in `content`.

## Tasks

`open`, `done`, `cancelled`. `kind`: `follow-up`, `intro`, `help-request`, `board-prep`, `reporting`, `other`. `from_update` links a task to the ask it came from. When the wiki already has a work-management task table, use that instead and leave `tasks` out.

New keys: the highest `T-` number plus one, comparing numbers (keys sort as text). Read the new key to check it is free before writing.

## Signals and runs

Statuses:

```text
proposed → accepted → applied
        ↘ rejected
        ↘ duplicate
```

- `proposed`: monitoring found it. Nothing has changed.
- `accepted`: a person said yes, in the site or by asking an agent. The next run, or the agent asked, applies `proposed` and marks it `applied`.
- `rejected`, `duplicate`: closed, kept.

`proposed` holds the exact write: `{ "table": "rounds", "key": "…", "set": { … } }`. Applying it reads the target record, merges `set`, validates against the table's schema, and writes with the version read. A signal for a record that changed since detection is re-checked before applying.

`runs` records one monitoring run: when, who, how many pages, how many signals, and what could not be read.

## Derived, never stored

Calculate these from the records; don't keep them as fields or Markdown tables: publicly reported funding per company, latest round and time since it, latest update and whether it is overdue (monthly: over 45 days; quarterly: over 120 days), KPI trends, companies per partner, open tasks per company, and signals waiting.

Gross or net fund performance (MOIC, IRR, TVPI, DPI) needs cost basis, valuations, fees and LP data that this skill does not hold. Don't compute or present them.
