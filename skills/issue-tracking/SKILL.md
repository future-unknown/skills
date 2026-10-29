---
name: issue-tracking
description: Set up issue tracking in Known that a team and its agents share — an issues table with a schema and usage rules in a wiki, plus a published issues site (board, list, issue history, live updates) that signs people in with Known. Use when a team wants to track bugs, features and tasks in Known, or asks to "set up issue tracking".
license: MIT
compatibility: Requires the Known CLI with the `wiki`, `code` and `sites` commands, permission to write the chosen wiki, and an organization admin (or the wiki's owner) to register and publish the site.
metadata:
  version: "0.4.0"
  category: business-ontology
---

# Issue tracking

Give a team one issue tracker that people and agents both use: issues are schema-checked records in a wiki, and a site in Known shows them as a triage desk — views, a list or board, and each issue with its links and history.

## When not to use it

- A short list of the team's own next actions, with no reporters, severities or workflow: use `work-management` tasks.
- A team that will keep its tracker elsewhere and only wants context in Known: record decisions and evidence in Known and link to the tracker's issues instead of copying them.

## Required reading

Read, relative to this directory:

1. `../../references/known-cli.md`
2. `../../references/data-modeling.md`
3. `../../references/ontology-principles.md`
4. `../../references/composition.md`
5. `../../references/skill-run.md`
6. `references/model.md`
7. `references/site.md`

Stop if a required reference is unavailable.

## What it sets up

1. **The issues table:** a page keyed by `id` with the schema in `assets/issue.schema.json`. Default path `<wiki>:issues`.
2. **The rules on that page:** `assets/issues-page.md`, filled in, so every agent reads how the team files and updates issues before it writes.
3. **The site:** the files in `assets/site/`, written into a code tree, registered as a site, given the wiki, and published.

The site reads the table's schema when it loads. Statuses become the workflow and the board's columns, enums become the choices, and link fields become references, so it fits a table whose schema differs from the default.

## Run

Follow the standard skill run, with these specifics.

### Orient

- Ask which wiki should hold the issues, listing the wikis from `known <session> wiki wikis`. Offer to create one (`known <session> wiki create issues --description "…"`) when none fits; creating a wiki takes an organization admin.
- Search for an existing tracker before proposing one, in each wiki the user may mean: `wiki search "issue" <wiki>:`, then `"bug"` and `"task"`, and `wiki tree <wiki>:`. When one exists, ask whether to reuse it or start a new table. A reused table keeps its records and schema; the site maps its fields (see `references/site.md`).
- Ask for the team's key prefix (`ISS`, `ENG`, `OPS`). Default to `ISS`.
- Check for a people directory (a contacts or people table). When one exists, assignees and reporters are links to its records; otherwise they are names.

### Propose

Present, and wait for approval:

- the wiki and table path, and whether the table is new or reused;
- the schema, with the prefix in the `id` pattern (`^ISS-[0-9]+$`) and in the `id` description's example, the `assignee` and `reporter` descriptions saying "a link to their record in `<people table>`" or "their name", and any statuses, types or labels the team asked for;
- the rules page text from `assets/issues-page.md`, filled in;
- the site: its name (default "Issues"), the code tree name (default `<wiki>-issues`), who may use it (every member, or named people and teams), and that its files are public while the data needs a sign-in;
- every command you will run, in order.

Do not seed example issues unless the user asks; `assets/examples.json` documents the shape.

### Apply

1. **Table:** fill in `assets/issues-page.md` — `{{PREFIX}}`, `{{TABLE}}` (`<wiki>:issues`), `{{PEOPLE_RULE}}` ("links to their record in `<people table>`" or "written as the person's name"), and `{{SITE_URL}}` as "the issues site" for now — and write the page (`wiki write <wiki>:issues --title "Issues" --file issues.md`), then attach the key and schema (`wiki meta <wiki>:issues --file meta.json`, with `{"key": "id", "schema": …}` — drop `$schema` and `title` from the asset). A reused table keeps its schema unless the user approved a change.
1b. **Example issues (only when the user asked for them):** adapt `assets/examples.json` to the team's prefix and people rule, check each key is free with `wiki get`, and `wiki set` them. They link only to each other, both ways.
2. **Code tree:** `code create <tree> --title "Issues" --description "The issues site for <wiki>:issues"`. Write every file under `assets/site/` to the same path in the tree with `code write <tree>:<path> --file <local file>`, keeping folders (`js/ui/app.js`). Each write reports the tree's problems so far; imports of files not written yet are expected until the last one. Write `site.json` last with the site's name and the real table: `{"title": "<site name>", "table": "<wiki>.issues"}` — a dot, not a colon. Then run `code check <tree>` and stop on any problem it still reports.
3. **Site:** `sites create "Issues" --source code:<tree>` (add `--user team:<id>` to narrow who may use it), then `sites attach <site> <wiki>`, then `sites publish <site>`. The publish prints the address.
4. **Address on the page:** replace "the issues site" on the table's page with the published address (`wiki edit <wiki>:issues --old "the issues site" --new "<address>"`), so people and agents reading the page find the site.

### Verify

- `wiki read <wiki>:issues --json` shows the key and the schema.
- `code check <tree>` reports no problems.
- `sites get <site>` shows the site live at its address, reading the wiki.
- The address answers, and its page carries the sign-in settings: `curl -s <address> | grep known-site`.
- Ask the user to open the address and sign in. A first visit can take several seconds while the packages are fetched.

### Report

The table path and schema, the site's address, who can use it, how to change it (below), and the next optional skill.

## Changing the site later

- **New files or edits:** write the changed files to the tree, `code check`, then `sites publish <site>`.
- **Back to an earlier version:** `code changes <tree>:` lists changes; `sites publish <site> --change <id>` publishes that one.
- **Another table or title:** edit `site.json` in the tree and publish.
- **More wikis:** `sites attach <site> <wiki>` and publish again, so the page's settings include it.

## Writing from the site

Sites read today. The site already holds the code to write — change a status or priority on an issue, drag a card to another column — and turns it on by itself when the organization lets sites write to the wiki (the site's capabilities include `set`). Until then, people change issues through their agents or in Known: `c` on an issue copies a reference an agent understands, and `o` opens it in Known.

## Boundaries

- One issue is one record. Its Markdown `content` holds the problem, evidence, acceptance criteria and discussion; fields hold current state and are not repeated in the content.
- Status changes update the record in place; Known keeps every version, and the site shows them as the issue's history. Do not add history fields.
- `done` and `cancelled` issues stay in the table.
- Customer names, security details and personal data follow the wiki's visibility. Choose a restricted wiki when issues will hold them.

## Composition

Works alone. With `relationship-management`, assignees, reporters and customers can link to contacts and organizations. With `work-management`, an issue's `parent` can link to an initiative's task. Neither is required.
