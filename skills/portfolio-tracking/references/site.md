# The portfolio site

`assets/site/` is a complete site with no build step: plain ES modules, Preact and htm for markup, zustand for state, Known's [known-vision](https://github.com/future-unknown/known-vision) package for signing in and live updates, and `methodry` for Known's streams. `imports.json` pins every package at an exact version; publishing turns it into the page's import map.

Keep `known-vision` (it replaced `wiki/session`) at 0.2.1 or later. Every page address is `<wiki>:<page>`. A site Known shows inside its own app asks Known for a token and is signed in without a click. Live updates come from its watch: one `site.watch` stream per browser, shared between tabs, reloading only the table that changed; where the organization's plan has no live updates it checks once a minute instead (the account menu says which: Live, or Checking every minute). When Known can't answer, the site says so instead of offering a sign-in.

## What it does

- **Portfolio:** every company as a card or a row in a table (a fact no company has, such as stage when the fund's site states none, is left off every card) — logo, name, one-liner, status, stage, the fund's people on its board, the latest update, and what its rounds publicly report. Filter by status, the fund's position (held, exited), the vehicle that holds it (when companies name more than one), sector and person (anyone the fund's site ties to a company: lead, board seat or related investment), or search.
- **Company:** at a glance, four figures (publicly reported raised, stage, the fund's entry round and year, its position) over a line of sectors, HQ and founding year and the fund's people on the board; then its funding timeline, its people, the fund's team on it (board seats and related investments, from `team`), open tasks, updates, the media it references, its own writing, and its history — who changed what, field by field, from the record's versions.
- **Updates:** every update across the portfolio, newest first, filtered by company or by where it came from: Press (with the publication's name and a link to the story), From companies, or From the fund.
- **Tasks:** open tasks by company.
- **Review:** what monitoring found, waiting for a decision, with the change each would make and its sources; the last run's time, status and pages it could not read.
- **Team:** the fund's people as portraits, in the groups the fund's own team page uses (`groups` on each record), most senior first. Each opens a page with their portrait, title, groups, bio, links (their page on the fund's site, profiles) and their companies as the fund's site lists them: board positions and related investments, and any company naming them lead partner.
- **Ask:** Known's assistant in a column beside the page (`a`, or Ask in the top bar). It answers from the same wiki, as the signed-in person, through `site.ask`: it can read and write exactly what the site can for that person, says what it is reading while it works, and lists any record it changed under its answer. Known keeps no conversation; the page sends the turns so far with each question. It needs the organization's plan to include Known's assistant (`site.whoami` says `assistant.available`); otherwise the panel says so.
- **Fund:** the fund's own profile — thesis, stages, sectors, geographies, check size and vehicles — with its sources.
- **Live:** changes made by anyone, people or agents, arrive while the site is open. A new record opens into its place; a changed one warms for a moment.
- **Keyboard:** `/` searches, `a` asks, `g` then `p` `u` `t` `r` `m` `f` switches view (Portfolio, Updates, Tasks, Review, Team, Fund), `Esc` closes a menu or Ask, or goes back within the site (never out of it), `?` lists them all. Opening a form puts focus in it; closing it puts focus back on the button that opened it.
- **Everywhere:** a slim top bar with the fund's logo, the views and the account, as fund sites lead; light and dark follow the system, unless the theme is light-only (`"dark": false`); on a phone the views scroll sideways under the logo, Ask takes the screen and the cards one column. Reduced motion is respected.

The address holds what is shown (`#/portfolio?status=active&layout=table`, `#/company/ferncloud`, `#/member/mara-lind`), so any view can be linked.

### What it shows carefully

- **"Reported raised" is a floor.** It sums the rounds that state an amount, per currency, and shows `≥`. Public sources miss rounds, so it is never presented as the total raised.
- **Where a claim comes from is a word, not a colour.** Each round carries its basis (`Public`, `Company-reported`, `Confirmed`); each update says whether the company reported it or it is a fund note, and a fund note sits apart on the page.
- **Overdue updates** follow the company's `reporting_cadence`: monthly after 45 days, quarterly after 120 days since its latest company-reported update. A company with a cadence and no update yet shows "No update yet".
- **Images are references.** Logos and headshots load from the address in their `media` record, without a referrer, lazily. A missing, broken or failing image shows the name's initials instead. A media record marked `broken` is not loaded at all.

## What it writes

Only when the wiki is attached to the site for writing and the person may write records there (the site's capabilities include `set`). Every write sends the record whole with the version it was read at; when someone changed it first, the site shows the current record and says the write did not save.

| Where | Write |
|---|---|
| Tasks, a company | Mark a task done, reopen it, or cancel it |
| Tasks, a company | Add a task: the next free `T-` number, `open`, created now (the key is read first to check it is free) |
| A company | Add a fund note: an `updates` record with `origin: fund-note`, `kind: call`, keyed `<company>-<date>-note` (then `-2`, `-3`) |
| Review | Accept, reject, or mark a signal duplicate (`status`, `decided_by`, `decided_at`); undo an acceptance |

Accepting a signal does not change the portfolio from the site. The next monitoring run applies accepted signals and marks them `applied`, so every change to companies, rounds and people goes through the same agent and the same checks. Nothing else is editable from the site; people change it through their agents or in Known.

## site.json

```json
{
  "title": "Portfolio",
  "wiki": "portfolio",
  "tables": { "companies": "companies" },
  "theme": null
}
```

- `title`: the site's name, shown in the browser tab and, without a fund record or logo, in the top bar.
- `wiki`: the wiki holding the portfolio. When null, the site uses the first wiki it reads that has a `companies` table.
- `tables` (optional): for a wiki whose pages have other names. Keys are the site's table names — `fund`, `team`, `companies`, `rounds`, `people`, `media`, `updates`, `tasks`, `signals`, `runs` — and values the page names in the wiki. A table the wiki lacks is skipped: no `signals` table hides Review, no `tasks` table hides Tasks.
- `theme` (optional): the fund's look, below.

## The theme: mirroring the fund's site

The import reads the fund's own website and fills `theme` so the site feels like the fund's: its paper and ink colours, its accent, its fonts, its corners and its logo. The agent writes it into `site.json` in the code tree (see `import.md`). The site's layout, structure and accessibility never change; only these tokens do.

```json
"theme": {
  "light": { "paper": "#FFFFFF", "surface": "#F2F1EC", "ink": "#1C2430", "accent": "#2F6FEB", "accentInk": "#1F55C4" },
  "dark":  false,
  "fonts": {
    "heading": { "family": "Source Serif 4", "href": "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap", "weight": 700, "leading": 1.05, "tracking": -0.01 },
    "body": { "family": "Inter", "href": "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap", "weight": 400 },
    "mono": null
  },
  "radius": 10,
  "controls": "pill",
  "cardBorder": false,
  "labels": "uppercase",
  "cards": "logo",
  "density": "comfortable",
  "logo": "[[media/example-ventures-logo]]"
}
```

| Field | Means | Becomes |
|---|---|---|
| `light`, `dark` | The colours for each scheme. Any key may be absent; that token keeps its default. `"dark": false` keeps the light look in dark mode too: use it when the fund's own site has no dark mode, so the site never shows its logos dark-on-dark. | |
| `paper` | The page background, as most of the viewport shows it | `--main`; `--pane` a step lighter and `--side` a step darker, mixed from it |
| `surface` | Cards, tables and notes, when the fund sets them apart from the page | `--surface`; dropped if ink on it is under 4.5:1 |
| `ink` | Body text | `--ink`; `--ink-soft` and `--ink-faint` mixed towards the paper |
| `accent` | The brand colour, for marks and fills | `--field`, `--field-wash`, `--current` |
| `accentInk` | The brand colour as text (links) | `--field-ink`; without it, the accent darkened or lightened until it reads |
| `hair` | Borders | `--hair`, `--hair-soft` |
| `fonts.heading`, `fonts.body`, `fonts.mono` | `family`, and `href`: a Google Fonts stylesheet, or null to use a font the system has | `--heading`, `--sans`, `--mono`, each falling back to the system stack |
| `fonts.heading.weight`, `.leading`, `.tracking` | The headings' weight (100–900), line height as a multiple of size (0.85–1.6) and letter spacing in em (−0.06–0.12) | `--heading-weight`, `--heading-leading`, `--heading-tracking` |
| `fonts.body.weight` | Body text weight (200–600) | `--body-weight` |
| `radius` | Card corner radius in px, clamped to 0–16 | `--r` |
| `controls` | `pill` for fully rounded buttons, inputs and selects | `--r-control` |
| `cardBorder` | `false` when the fund's cards have no outline | `--card-line` |
| `labels` | `uppercase` for navigation and small labels in capitals | `--label-transform`, `--label-tracking`, `--nav-size` |
| `cards` | `logo` for logo-first portfolio cards: the mark large and centred, details below | the `has-logo-cards` class |
| `logos` | `framed` when logo files are tiles with the mark centred in white space: they fill a 3:2 tile instead of being inset | the `has-framed-logos` class |
| `names` | `{ "font": "body" \| "heading", "color": "accent" \| "ink" }`: how names on cards and portraits are set, when the fund sets them apart from its headings | `--name-font`, `--name-weight`, `--name-color` |
| `density` | `comfortable` (the default) or `compact` | tighter cards, rows and sections |
| `logo` | `[[media/<id>]]` shown in the top bar | falls back to the fund record's `logo`, then the plain mark |

Rules the site enforces when it loads (`js/theme.js`):

- **Contrast, checked at runtime.** `ink` on `paper` must reach 4.5:1 and `accentInk` on `paper` 4.5:1 (WCAG AA for text); `accent` on `paper` 3:1 (marks). A pair that fails falls back to the default tokens for that pair, with a warning in the console (`[theme] light: ink on paper is 1.16:1…`). The mixed secondary text is checked on the surface where it is hardest to read and pushed towards the ink until it passes.
- **Fonts only from Google Fonts**, over https. Any other `href` is ignored with a warning, and its family falls back to the system stack. Family names are letters, digits, spaces and hyphens only.
- **Both schemes respected.** Light colours apply only when the system is light. Without `dark`, dark mode keeps the default dark surfaces and takes the light `accent` only when it reads on them.
- **No theme, no change.** Without `theme`, the site looks exactly as it does by default.

To try a theme without the import, edit `theme` in the tree's `site.json` and publish. Open the browser console to see any pair that fell back.

## Files

| File | Role |
|---|---|
| `index.html` | The page; publishing adds the import map and the sign-in settings |
| `imports.json` | Pinned packages |
| `site.json` | Which wiki, its table names, the title and the theme |
| `app.js` | Starts the app |
| `js/known.js` | Signing in, calls to Known, reading a wiki's tables and schemas, live changes |
| `js/store.js` | State, the address, loading every table, live refresh, and the writes |
| `js/data.js` | Links between records, money, the reported-raised floor, reporting cadence |
| `js/theme.js` | The fund's theme: tokens, fonts, contrast checks |
| `js/history.js` | What each version of a record changed |
| `js/markdown.js` | Record writing as safe Markdown, with wiki links |
| `js/icons.js` | Icons and the company status mark |
| `js/ui/*.js` | The frame and top bar, Ask, and each view: portfolio, company, updates, tasks, review, team and member, fund, shortcuts |
| `style.css` | Known's paper and ink, light and dark, overridden by the theme's tokens |

## Calls it makes

Every call names a page by its full address, the wiki, a colon, then the page: `portfolio:companies` (`fullPath` in `js/known.js`). Known refuses a path without its wiki, and the wiki's description keys its pages the same way; `splitPath` reads both that and the older dotted form.

All as the signed-in person, within what the site was given: `site.whoami`, the wiki's description (`GET /rpc/<wiki>`), `wiki.records` for each table, `wiki.get`, `wiki.history` for a company's history, the live stream, and `site.ask` (a stream, through `methodry`) for Ask. When the site may write, it also calls `wiki.set` with the record's version, and `wiki.get` to read a new key before writing it.

## Adapting the site

The site is a working starting point for the default schemas, not a product that covers every fund. Adapt a copy to what the fund approved before writing it to the code tree; once published, the site is the fund's.

Keep each change small and in the code's own style: plain modules, htm markup, the same class names and tokens in `style.css`, no new packages unless pinned in `imports.json`.

| The fund has | Change |
|---|---|
| **Other page names** (a reused wiki) | Nothing in the code: map them in `site.json` (`tables`). |
| **Its own look** | Nothing in the code: `theme` in `site.json`. |
| **Other KPIs** in updates | Fields in `metrics.other` show by themselves. A KPI that deserves its own column: add it to `METRICS` in `js/ui/updates.js`. |
| **Other company statuses** | `STATUS_ORDER` in `js/ui/portfolio.js`, and a shape for it in `StatusMark` in `js/icons.js` (a word always shows beside it). |
| **Another reporting rhythm** | `GRACE_DAYS` in `js/data.js`. |
| **No monitoring** | Nothing: without a `signals` table, Review is hidden. |

After adapting: check the tree, publish, open the site, and look at each change where it should show. Say in the report what was adapted.

## Seeing it before publishing

An address that answers proves nothing about the layout. Before publishing a change, run the site locally against the wiki's real records and look at every view at desktop and phone width: the portfolio grid, a company, the team, a person, Ask open and closed.

Known's session and API can be stood in for, since the site reaches them only through `known-vision`, `methodry` and `/rpc`:

- an import map that points `known-vision` at a module whose session is always signed in and whose live store is quiet, and `methodry` at one that streams a canned answer;
- a `#known-site` element naming a local host;
- a local server that serves the site's files and answers `/rpc/<wiki>` with the tables' keys and schemas, and `site.whoami`, `wiki.records`, `wiki.get`, `wiki.history` and `wiki.links` from records read out of the wiki.

Look at every state, not only the happy path: loading, signed out, Known unreachable, each view empty and full, Ask open and closed, the shortcuts sheet; at desktop width and at phone width (a 390px frame around the page works when the window can't be narrowed); in light and dark mode. Measure edges rather than eyeballing them: the logo, each page's bar and its content should share a left and a right edge on every page.

Keep these in a scratch folder, never in the code tree. After publishing, ask the person to look too: their browser is signed in, the stand-ins are not.

## When something is wrong

| The site says | Do |
|---|---|
| This page is not published from Known yet | Publish the site from Known; opening the tree's files elsewhere has no sign-in settings |
| This site reads no wiki yet | Let the site read the portfolio wiki, then publish again |
| No portfolio found | Check `wiki` in `site.json`, and that its `companies` page has a key and a schema; with renamed pages, set `tables`. If all of that is right, the site is reading page addresses in a form Known no longer sends: check `splitPath` in `js/known.js` against the keys of the wiki's description |
| … has no schema | Set the schema in the table page's properties |
| The sign-in comes back signed out | The person is not a member of the site's organization, cannot read its home wiki, or the site is limited to other people (the site's details in Known) |
| Writes are missing (the account menu says "read only") | The wiki is attached for reading only, or the person can only read it |
| A logo shows initials | Its `media` record is `broken`, its address no longer answers, or the company has no `logo` link |
| The fund's colours or fonts don't show | The browser console names each pair that failed contrast and each font that was ignored |
