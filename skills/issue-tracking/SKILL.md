---
name: issue-tracking
description: Set up issue tracking in Known that a team and its agents share — an issues table with a schema and usage rules in a wiki, plus a published issues site (board, list, issue history, live updates) that signs people in with Known. Use when a team wants to track bugs, features and tasks in Known, or asks to "set up issue tracking".
license: MIT
compatibility: Requires a way into Known (its tools connected to the agent, or the Known CLI) that can write pages and records, change a page's schema, and manage code trees and sites; permission to write the chosen wiki; and an organization admin (or the wiki's owner) to register and publish the site.
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

1. `../../references/known-access.md` (how to find your way into Known and the operations it offers; this skill names none)
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

- Ask which wiki should hold the issues, listing the wikis you can use. Offer to create one (named `issues`, with a description) when none fits; creating a wiki takes an organization admin.
- Search for an existing tracker before proposing one, in each wiki the user may mean: search for "issue", "bug" and "task", and look at the wiki's page tree. When one exists, ask whether to reuse it or start a new table. A reused table keeps its records and schema; the site maps its fields (see `references/site.md`).
- Ask for the team's key prefix (`ISS`, `ENG`, `OPS`). Default to `ISS`.
- Check for a people directory (a contacts or people table). When one exists, assignees and reporters are links to its records; otherwise they are names.
- Ask how the team works, in one message, each question with its default. Ask only these; anything else does not change the setup.
  1. **How do you group work?** Projects that have an owner, status and dates of their own (a `projects` table, and a `project` link on each issue); a short fixed list such as teams or areas (an enum field); or nothing beyond labels. Default: labels.
  2. **Is your workflow different?** Show the default statuses in order and keep them unless the team names other steps.
  3. **Do you work in cycles or sprints?** Default: no. When yes, a `cycle` field and a view of the current cycle.

### Propose

Present, and wait for approval:

- the wiki and table path, and whether the table is new or reused;
- what the answers change: fields and enums added to the schema, any `projects` table (`assets/project.schema.json`), and the site adaptations from `references/site.md`;
- the schema, with the prefix in the `id` pattern (`^ISS-[0-9]+$`) and in the `id` description's example, the `assignee` and `reporter` descriptions saying "a link to their record in `<people table>`" or "their name", and any statuses, types or labels the team asked for;
- the rules page text from `assets/issues-page.md`, filled in;
- the site: its name (default "Issues"), the code tree name (default `<wiki>-issues`), who may use it (every member, or named people and teams), and that its files are public while the data needs a sign-in;
- whether to add four example issues so the team sees the site working on day one. Ask; the default is no. Examples carry the label `example`, so they are easy to find and remove;
- every write you will make, in order.

Add example issues only when the user says yes to that question.

### Apply

Read the skill's files (`assets/…`, `references/…`) from wherever you have the skill: its folder, or the repository at https://github.com/future-unknown/skills under `skills/issue-tracking/`.

1. **Table:** fill in `assets/issues-page.md` — `{{PREFIX}}`, `{{TABLE}}` (the table's address), `{{PEOPLE_RULE}}` ("links to their record in `<people table>`" or "written as the person's name"), and `{{SITE_URL}}` as "the issues site" for now — and write it as the page `issues` in the wiki; its first heading, `# Issues`, is its title (set a title too if your way in takes one). Then set the page's metadata to one object, `{"key": "id", "schema": <the schema asset without $schema and title>}`. A reused table keeps its schema unless the user approved a change.
1a. **Projects (only when the team has them):** create the page `projects` the same way, keyed by `id`, with `assets/project.schema.json`, before the issues that link to it.
1b. **Example issues (only on a yes):** adapt the issue records in `assets/examples.json` (listed under `issue.schema.json`) to the team's prefix and people rule, keep the `example` label on each, read each key to check it is free, and write them as records. They link only to each other, both ways.
2. **Code tree:** copy `assets/site/` and adapt the copy to the approved answers, following "Adapting the site" in `references/site.md`. Then create the code tree (title "Issues", described as the issues site for the table) and write every file of the copy to the same path in the tree, keeping folders (`js/ui/app.js`), with its whole content. Each write reports the tree's problems so far; imports of files not written yet are expected until the last one. Write `site.json` last with the site's name and the real table: `{"title": "<site name>", "table": "<wiki>.issues"}` — the wiki and page joined with a dot. Then check the tree and stop on any problem it still reports.
3. **Site:** register the site with the code tree as its source, let it read the wiki, then publish it. Publishing gives the address. A newly registered site is open to every member of the organization; narrowing it to named people or teams is done in Known, if the team asked for it.
4. **Address on the page:** on the table's page, replace "the issues site" with the published address, so people and agents reading the page find the site.

### Verify

- The table's page shows the key and the schema in its metadata.
- Checking the tree reports no problems.
- The site shows as published at its address, reading the wiki.
- If you can fetch web pages, the address answers and its page carries the sign-in settings (an element with the id `known-site`).
- Every adaptation shows where it should: a new filter in the sidebar, a new grouping, a new field on an issue.
- Ask the user to open the address and sign in. A first visit can take several seconds while the packages are fetched.

### Report

The table path and schema, the site's address, what was adapted in the site and why, who can use it, how to change it (below), and the next optional skill. When examples were added, list their keys and how to remove them: filter the site by the `example` label, and delete each record.

## Changing the site later

- **New files or edits:** write the changed files to the tree, check it, then publish the site.
- **Back to an earlier version:** list the tree's changes, and publish the site as of the one to go back to.
- **Another table or title:** edit `site.json` in the tree and publish.
- **More wikis:** let the site read the wiki, and publish again so the page's settings include it.

## Writing from the site

Sites read today. The site already holds the code to write — change a status or priority on an issue, drag a card to another column — and turns it on by itself when the organization lets sites write to the wiki (the site's capabilities include `set`). Until then, people change issues through their agents or in Known: `c` on an issue copies a reference an agent understands, and `o` opens it in Known.

## Boundaries

- One issue is one record. Its Markdown `content` holds the problem, evidence, acceptance criteria and discussion; fields hold current state and are not repeated in the content.
- Status changes update the record in place; Known keeps every version, and the site shows them as the issue's history. Do not add history fields.
- `done` and `cancelled` issues stay in the table.
- Customer names, security details and personal data follow the wiki's visibility. Choose a restricted wiki when issues will hold them.

## Composition

Works alone. With `relationship-management`, assignees, reporters and customers can link to contacts and organizations. With `work-management`, an issue's `parent` can link to an initiative's task. Neither is required.
