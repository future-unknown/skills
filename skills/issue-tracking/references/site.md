# The issues site

`assets/site/` is a complete site with no build step: plain ES modules, Preact and htm for markup, zustand for state, and the `wiki` package's `wiki/session` for signing in with Known. `imports.json` pins every package at an exact version; publishing turns it into the page's import map.

## What it does

- **Views:** Assigned to me, Open, In progress, Blocked (by status, or by an open `blocked_by` issue), Changed this week, Closed, All. Labels and people in the sidebar filter any view.
- **List:** grouped by status, priority or assignee, with the priority, key, status, title, labels, blockers, assignee and last change on each row.
- **Board:** a column per status in workflow order; closed columns stay narrow until opened.
- **Issue:** fields, the issues it waits on, blocks, is part of or relates to, its sub-issues, other pages that link to it, links to the work, its Markdown content, and its history — who changed what, field by field, from the record's versions.
- **Live:** changes made by anyone, people or agents, arrive while the site is open. A new issue opens into its place; a changed one warms for a moment.
- **Keyboard:** `j`/`k` move, `/` filters, `⌘K` finds any issue, view, label or person, `v` switches list and board, `g` then a letter switches view, `o` opens the issue in Known, `c` copies a reference for an agent, `y` copies the link, `?` lists them all.
- **Everywhere:** light and dark follow the system; on a phone the views, list and issue each take the screen in turn. Reduced motion is respected.

The address holds what is shown (`#/open?label=auth&issue=ISS-014`), so any view or issue can be linked.

## site.json

```json
{
  "title": "Issues",
  "table": "product.issues",
  "fields": { "assignee": "owner" },
  "closed": ["done", "cancelled"]
}
```

- `title`: the site's name, shown in the sidebar and the browser tab.
- `table`: the wiki and page, joined with a dot. When null, the site looks through the wikis it reads for the first keyed table whose schema has a title and a status.
- `fields` (optional): for a reused table whose fields have other names. Roles: `title`, `status`, `priority`, `severity`, `type`, `assignee`, `reporter`, `labels`, `parent`, `related`, `blockedBy`, `blocks`, `links`, `due`, `created`, `content`. Without it the site recognises common names (`owner`, `tags`, `state`, `due_date` and others).
- `closed` (optional): the statuses that count as closed, when they are not named done, cancelled, closed, resolved or wontfix.

## Files

| File | Role |
|---|---|
| `index.html` | The page; publishing adds the import map and the sign-in settings |
| `imports.json` | Pinned packages |
| `site.json` | Which table, and what to call the site |
| `app.js` | Starts the app |
| `js/known.js` | Signing in, calls to Known, reading a wiki's tables and schemas, live changes |
| `js/model.js` | What the schema says: workflow, choices, field roles, links |
| `js/store.js` | State, views, filters and the address |
| `js/history.js` | What each version of a record changed |
| `js/markdown.js` | Content as safe Markdown, with wiki links |
| `js/ui/*.js` | The desk, sidebar, list, board, issue, palette and shortcuts |
| `style.css` | Known's paper and ink, light and dark |

## Calls it makes

All as the signed-in person, within what the site was given: `site.whoami`, the wiki's description (`GET /rpc/<wiki>`), `wiki.records`, `wiki.get`, `wiki.history` and `wiki.links`, and the live stream. When the site's capabilities on the wiki include `set`, it also writes with `wiki.set` and the record's version, and reloads the record when someone changed it first.

## Adapting the site

The site is a working starting point for the default schema, not a product that covers every setup. Adapt a copy to what the team answered before writing it to the code tree; once it is published, the site is the team's.

Keep each change small and in the code's own style: plain modules, htm markup, the same class names and tokens in `style.css`, no new packages unless they are pinned in `imports.json`.

| The team has | Change |
|---|---|
| **Projects** (a `projects` table, a `project` link on issues) | `js/model.js`: add `project: ['project']` to `ROLE_GUESSES`. `js/store.js`: in `load`, also read `<wiki>.projects` with `loadRecords` and keep a map of id to title; add `project` to `readRoute`, `routeHash` and `matches` like `label`; count projects in `facets`; add a `project` branch to `keyOf` in `groupsOf`. `js/ui/sidebar.js`: a Projects section like Labels, showing titles. `js/ui/shell.js`: a "By project" option in the group select. `js/ui/issue.js`: a Project row in `Properties` that shows the title and opens the project in Known. |
| **A fixed list** (`team`, `area`) | The same as projects without the extra table: the values come from the field's enum, in its order. |
| **Cycles** (`cycle`) | `js/store.js`: a `{ id: 'cycle', label: 'This cycle' }` entry in `VIEWS` and a `case 'cycle'` in `inView` that keeps open issues in the latest cycle. `js/ui/sidebar.js`: its icon and key in `VIEW_ICONS` and `VIEW_KEYS`; `js/ui/shell.js`: the same key in the `g` map; `js/ui/help.js`: the shortcut. |
| **Other statuses or priorities** | Nothing: the site reads them from the schema. Name unusual closed statuses in `site.json` (`closed`). |
| **Other field names** (a reused table) | Nothing in the code: map them in `site.json` (`fields`). |

After adapting: run `code check <tree>`, publish, open the site, and look at each change where it should show — the sidebar, the group select, an issue that has the field. Say in the report what was adapted.

## When something is wrong

| The site says | Do |
|---|---|
| This page is not published from Known yet | Publish with `sites publish <site>`; opening the tree's files elsewhere has no sign-in settings |
| This site reads no wiki yet | `sites attach <site> <wiki>`, then publish again |
| No table at … | Check `table` in `site.json` uses a dot (`product.issues`), and that the page has a key and a schema |
| … has no schema | Attach the schema with `wiki meta` |
| The sign-in comes back signed out | The person is not a member of the site's organization, or the site is limited to other people (`sites get <site>`) |
