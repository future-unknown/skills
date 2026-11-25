---
name: portfolio-tracking
description: Set up a venture fund's portfolio tracker in Known, centred on the companies — what each has raised, who runs it, what it reports, and what the fund owes it — by importing the fund, team, portfolio, logos and headshots from the fund's own website, then adding monitoring instructions an agent follows to keep it current and a portfolio site for the investment team. Use when a fund wants to track its portfolio companies in Known, or asks to "set up portfolio tracking".
license: MIT
compatibility: Requires a way into Known (its tools connected to the agent, or the Known CLI) that can create a wiki, write pages and records, change a page's schema, and manage code trees and sites; a way to fetch public web pages for the import (or pasted pages); and someone who can grant the wiki and publish the site.
metadata:
  version: "0.1.0"
  category: business-ontology
---

# Portfolio tracking

Give a venture fund one place for its portfolio: each company with its funding history, people, updates and open tasks, filled from the fund's own website on day one, kept current by an agent that proposes changes, and shown to the investment team as a site.

## When not to use it

- **Fund accounting and LP reporting:** cost basis, valuations, fees, capital accounts, MOIC/IRR/TVPI/DPI. This skill holds none of that and must not present it.
- **Deal flow:** sourcing, pipeline and investment committee before money moves. Tracking starts when the fund has invested.
- **A company raising money:** use `fundraising`.

## Required reading

Read, relative to this directory:

1. `../../references/known-access.md` (how to find your way into Known and the operations it offers; this skill names none)
2. `../../references/data-modeling.md`
3. `../../references/ontology-principles.md`
4. `../../references/composition.md`
5. `../../references/skill-run.md`
6. `references/model.md`
7. `references/import.md`
8. `references/site.md`

Stop if a required reference is unavailable. Read the skill's files from wherever you have the skill: its folder, or the repository at https://github.com/future-unknown/skills under `skills/portfolio-tracking/`.

## What it sets up

All in one restricted wiki, `portfolio` by default:

1. **The home page** `portfolio` from `assets/portfolio-page.md`: what is here and the rules every person and agent follows.
2. **Ten tables**, each a page keyed by `id` with its schema from `assets/`: `fund`, `team`, `companies`, `rounds`, `people`, `media`, `updates`, `tasks`, `signals`, `runs`.
3. **The import:** the fund, team, portfolio companies and their logos and headshots, from the fund's website, after approval.
4. **The page** `monitoring` from `assets/monitoring-page.md`: what an agent does on each monitoring run, including filing the past days' press about each held company into `updates`.
5. **The site:** the files in `assets/site/`, themed to mirror the fund's own website (its colours, fonts, corner radius and logo), written into a code tree, registered with `portfolio` as its home, allowed to read and write it, and published.

## Permissions

Known grants access per wiki, never per table or record, so the wiki is the boundary:

- **Restricted.** Create `portfolio` restricted, never open to the whole organization. It holds confidential ownership, check sizes and the fund's views. A wiki is restricted when it is granted only to named people and teams, not to the organization's everyone team; check its access before writing anything into it.
- **Owners need a grant too.** An organization owner can see a restricted wiki's grants but not its content. Grant the person running the setup admin on the wiki directly, besides any team grant.
- **The investment team** gets write, through a team (default `investment-team`) so joiners and leavers change in one place. One or two partners get admin.
- **The site** has `portfolio` as its home: only people who can read the wiki can sign in, so the team's grant is the site's access too. It reads and writes the wiki as the signed-in person.
- **Monitoring** runs as someone on the team, through their agent, with their access. Its rule to only write signals and runs is in its instructions, not enforced by Known. A fund that wants it enforced gives monitoring its own account and a separate wiki for `signals` and `runs`; then the account is an organization member and can write to every open wiki (including `general`, unless the organization narrowed it), so check those first. Don't set this up unless asked.
- **No outsiders.** Don't grant founders, LPs or advisers access to this wiki.

## Run

Follow the standard skill run, with these specifics.

### Orient

- Confirm the organization. Search for an existing portfolio, investment or company tracker ("portfolio", "investments", "companies", "cap table"); when one exists, ask whether to reuse it. A reused table keeps its records and schema; map its fields and propose only additions.
- Check for tables this skill can link to instead of duplicating: a contacts table (people link to it with `contact`), a work-management task table (use it and leave out `tasks`).
- Ask, in one message, each with its default:
  1. **The fund's website.** Required.
  2. **The wiki:** create `portfolio` (restricted), or name another restricted wiki.
  3. **Who gets access:** the team to grant write (default: create `investment-team` with the people named) and who gets admin.
  4. **Also read each company's own website** for founders, team, HQ and rounds? Default no; say how many pages it would add.
  5. **Reporting cadence** to expect from companies: monthly, quarterly, or none. Default quarterly.
  6. **How often monitoring runs:** default daily. Each run checks the fund's own site and the companies checked longest ago, so a large portfolio is covered over a few days.
  7. **Example records** so the site shows working data before the import? Default no.

### Propose

Present, and wait for approval:

- the wiki, its restriction, and every grant;
- the tables and their schemas, and any table left out or reused;
- the home page and monitoring page text, filled in;
- the site: its name (default "Portfolio"), the code tree name (default `portfolio-site`), and that its files are public while the data needs a sign-in;
- the site's theme taken from the fund's website (`references/import.md`, "The fund's look"): each colour, font, radius and logo with where it came from, any font substituted for licensing, and any colour adjusted for contrast;
- the import's bounds (pages, hosts) and that its results come back for approval before anything is written;
- every write, in order.

### Apply

1. **Wiki:** create it with only the approved grants (the team's write grant and each admin) and none for the organization's everyone team; that is what makes it restricted, as there is no separate switch. When the team does not exist, create it and add the named people first. Read the wiki's grants back before writing anything into it.
2. **Tables:** for each of `fund`, `team`, `companies`, `rounds`, `people`, `media`, `updates`, `tasks`, `signals`, `runs`, in that order: write the page (`# Fund`, `# Team`… with one line on what it holds and a link to [[portfolio]]), then set its metadata to one object, `{"key": "id", "schema": <the schema asset without $schema and title>}`. Attach every schema before writing any record.
3. **Home page:** fill in `assets/portfolio-page.md` (`{{FUND_NAME}}`, `{{SITE_URL}}` as "the portfolio site" for now) and write it as the wiki's page `portfolio`.
4. **Import:** follow `references/import.md`. Propose in batches; write each approved batch. It ends with the last month's press about each held company, so the Updates view isn't empty on day one.
5. **Monitoring page:** fill in `assets/monitoring-page.md` (`{{FUND_NAME}}`, `{{CADENCE}}` as "every day" or the chosen cadence, `{{PAGE_LIMIT}}` as 150: the budget for companies' own sites, about four pages a held company, so 150 covers some 35 companies a run and a portfolio of 130 in four days; raise it when the user wants each company checked more often. The fund's site and press run outside it) and write it as `monitoring`.
6. **Site:** follow `references/site.md`: write the files into a new code tree, `site.json` last with the fund's name, the wiki and the approved `theme`; check the tree and stop on any problem; register the site with `portfolio` as its home and the tree as its source; let it read and write the wiki; publish.
7. **Address:** on the home page, replace "the portfolio site" with the published address.
8. **Examples (only on a yes):** adapt `assets/examples.json` to the chosen wiki, keep every name and domain obviously synthetic (`.example`), and list their keys so they can be removed.

### Verify

- The wiki is restricted and its grants are exactly the approved ones.
- Each table's page shows key `id` and its schema; a record of each kind written reads back and validates.
- Search finds an imported company by name.
- No record holds a personal email, phone number or address, and no amount lacks a currency.
- The tree reports no problems; the site is published, reads and writes `portfolio`, and its address answers with the sign-in settings (an element with the id `known-site`).
- Before publishing, look at the site running locally against the wiki's real records (`references/site.md`, "Seeing it before publishing"), at desktop and phone width.
- An address that answers is not a working site. The site must be seen signed in: open it yourself if your browser is signed in to Known, otherwise ask the user to sign in and tell you what the Portfolio view shows. It must list as many companies as the table holds; "No portfolio found" or an empty view is a failure to fix before reporting.
- Compare the site with the screenshot of the fund's portfolio page taken during the import: page and card colours, heading font, weight and size, corner shapes, navigation style and card layout. Fix the theme until a person who knows the fund's site would recognise it, and say what still differs (a substituted font, for instance).
- Text stays readable (AA contrast) and focus rings stay visible, in light and dark.

### Report

The wiki and its access, the tables, what the import found and wrote (per table), what it could not read, the uncertain items left, the site's address, and how to run monitoring.

## Running monitoring

The skill writes the instructions; it does not schedule them, because skills name no tools. Tell the user how to run it with what they have:

- **By hand:** ask an agent connected to Known to "run portfolio monitoring from portfolio:monitoring".
- **On a schedule:** any scheduled agent with Known access and web access (a scheduled Claude task, a routine, or a job that runs an agent with the Known CLI) given the same instruction.
- **When the fund's site blocks plain clients** (a bot check such as Cloudflare's, seen during the import): the run needs a real browser for the fund's pages. A scheduled cloud agent without one can still check companies and press; then read the fund's own site from a machine with a browser, weekly or when someone asks, and say so in the setup report. Never try to get past a bot check.

Each run writes a `runs` record and `signals`; the team accepts or rejects signals in the site's Review view, and the next run applies what was accepted.

## Filing updates

The lowest-touch way in is the founders' existing emails: someone forwards an update to an agent and says "file this for Ferncloud". The agent follows the home page's rules: one `updates` record with the metrics as stated, a proposed task for each ask, and proposed (never automatic) changes to companies, people or rounds. Notes from calls and board meetings are filed the same way with origin `fund-note`.

## Boundaries

- Companies are the centre; the fund's own position is a few confidential fields on the company and its rounds, null until the team states them.
- Rounds are every round a company raised. Sums are "at least this much publicly reported", never "total raised".
- A company's reported metrics are its claims; the fund's view lives in its own notes. Neither overwrites the other.
- Monitoring proposes; people decide. Nothing it finds changes a record until accepted.
- Media are references: Known stores the URL, fingerprint and alt text, not the file.
- Public, work-related information only about people, from the fund's and companies' own pages. Remove anyone on request.
- Exits, shutdowns and departures need a source that says so. Silence is not evidence.

## Composition

Works alone. With `relationship-management`, people link to contacts (`contact`) and companies can be matched to organizations; this skill doesn't create either. With `work-management`, use its tasks instead of `tasks`. `fundraising` is the other side of the table and does not link here.
