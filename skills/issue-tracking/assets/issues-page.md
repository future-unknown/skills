# Issues

Every bug, feature, improvement and task, one record each, keyed `{{PREFIX}}-` and a number (`{{PREFIX}}-014`). People and agents both file and update issues here; the team works through them at {{SITE_URL}}.

## Before you write

- **New issue:** list the keys (`wiki records {{TABLE}} --json`), take the highest number plus one — keys sort as text, so `{{PREFIX}}-1000` comes before `{{PREFIX}}-999` — and `wiki get {{TABLE}}/<key>` to check it is free right before writing. `wiki set` replaces a record with the same key.
- **Update:** `wiki get` the issue, change only what changed, and write it back whole with `--if-version <_v>`. If refused, someone changed it first: get it again and redo the change.
- Read this page's schema (`wiki read {{TABLE}} --json`) and set only declared fields.

## Workflow

`triage` → `backlog` → `planned` → `in_progress` → `in_review` → `done`

Use `blocked` when work cannot continue, with the blocker linked in `blocked_by`. `cancelled` says why in the content. Closed issues stay here.

## Fields

- **Priority** is when: `p0` urgent, `p1` high, `p2` normal, `p3` low. **Severity** is how bad a bug is, and is separate.
- **Assignee** and **reporter** are {{PEOPLE_RULE}}.
- **Links to other issues** are wiki links (`[[issues/{{PREFIX}}-009]]`) and go both ways: `blocked_by` on one is `blocks` on the other; `related_to` on both.
- **Links** to work: add the pull request, commit or deploy when you ship.
- **created_at** is when it was filed, in UTC, from the clock, and never changes.

## Content

Start with the problem. Then evidence, acceptance criteria as a checklist, and discussion. Don't repeat the fields. Keep what was observed apart from guesses and proposals. Don't set a status, assignee or priority you inferred: ask.
