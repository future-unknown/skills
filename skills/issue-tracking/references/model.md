# Issue model

## The issue

A bug, feature, improvement or task the team will act on, one record each, keyed by the team's prefix and a number (`ISS-014`). Keys are never reused, so "ISS-014" means one thing to every person and agent.

| Field | Owns |
|---|---|
| `title` | What is wrong or wanted, in one line |
| `type` | `bug`, `feature`, `improvement`, `task` |
| `status` | Where it is in the workflow |
| `priority` | When it should be done: `p0` urgent to `p3` low |
| `severity` | For bugs: how bad the impact is (`critical` to `minor`); not the same as priority |
| `assignee`, `reporter` | Who is doing it and who reported it: a link to their record when the team has a people directory, otherwise a name |
| `labels` | Short lowercase areas (`auth`, `billing`) |
| `parent`, `related_to`, `blocked_by`, `blocks` | Links to other issues |
| `links` | Where the work happened: pull requests, commits, releases, deploys |
| `due_at` | A real date it must be done by, or null |
| `created_at` | When it was filed, in UTC; kept on every update |
| `source_paths` | Where the report came from |
| `content` | The problem, evidence, acceptance criteria and discussion, in Markdown |

## Workflow

`triage` → `backlog` → `planned` → `in_progress` → `in_review` → `done`

- `triage`: reported, not yet looked at. Someone decides whether it is real and how urgent.
- `backlog`: accepted, not scheduled.
- `planned`: scheduled for the current or next stretch of work.
- `in_progress`, `in_review`: being worked on, then checked.
- `blocked`: active work cannot continue; say why in the content and link the blocker in `blocked_by`. Return to the right state when unblocked.
- `done` and `cancelled` are closed. Cancelled says why in the content. Closed issues stay in the table.

The order of the `status` enum in the schema is the workflow order. The site uses it for its columns and groups, treats `done`, `cancelled` (and `closed`, `resolved`, `wontfix`) as closed, `in_progress` and `in_review` as active, and `blocked` as blocked. A team that renames or adds statuses keeps them in workflow order.

## Rules agents follow

- **New issue:** list the table's keys and take the highest number plus one. Keys sort as text (`ISS-1000` comes before `ISS-999`), so compare the numbers, not the order. Read the new key to check it is free immediately before writing: writing a record replaces any record with the same key.
- **Update:** read the issue, change only what changed, and write it back whole with the version you read (`_v`). If refused, someone changed it first: read it again and redo the change.
- **Links go both ways:** when ISS-014 is blocked by ISS-009, ISS-009 lists ISS-014 in `blocks`. `related_to` is added on both.
- **Content starts with the problem.** Don't repeat the fields in it. Keep what was observed apart from guesses and proposals.
- **Don't infer.** No status from age or silence, no assignee from who wrote last, no priority from tone.
- **Who did what** is in the record's history in Known, not in the record.

## Grouping work

Teams group issues in one of three ways. Pick the one the team describes; don't add the others.

- **Labels** (the default): short lowercase words on the issue. Enough for most small teams.
- **A fixed short list** (teams, areas, components): an enum field on the issue, such as `team` with `["web", "mobile", "platform"]`. Adding a value is a schema change.
- **Projects with their own state**: a `projects` table (`assets/project.schema.json`) with an owner, status and dates, and a `project` link on each issue (`[[projects/billing-v2]]`). The project's own description and decisions live in its record's content.

Cycles or sprints, when a team uses them, are a `cycle` field (`"2026-W44"` or a link to a cycles table); don't add them by default.

## Links

Issue references are wiki links to the record: `[[issues/ISS-009]]`, or `[[<wiki>:issues/ISS-009]]` from another wiki. A link shows in the target's backlinks and opens it; a bare ID is only text. The schema checks each link field has the `[[…]]` form.
