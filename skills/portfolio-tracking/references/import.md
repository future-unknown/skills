# Importing from the fund's website

The first run fills the wiki from the fund's own public website: the fund, its team, its portfolio, and the logos and headshots on those pages. It reads; the user approves; then it writes.

## What you need

A way to fetch web pages (a fetch or browser tool). If you have none, say so and ask the user to paste the fund's about, team and portfolio pages; continue from the pasted text with the same rules. Don't install anything.

## Bounds

- **Only the fund's own site** for the fund pass: same host, or its `www.` form. Follow links only to pages about the fund, team, portfolio, companies and news.
- **At most 30 pages** for the fund pass, plus one page per team member for their profile and one per company for its detail page on the fund's site, when the site has them (below). Say the total in the proposal ("30 pages, 56 profiles, 212 company pages"). Read `robots.txt` first and skip what it disallows. One request at a time.
- **The company pass is optional** and asked for (default no): the homepage, about/team page and newsroom of each company's own site, at most 5 pages each. Offer it with the count ("about 40 companies, up to 200 pages").
- No search engines, people-search, social networks or data vendors, with one exception: the press pass (below) runs a news search for each held company by name. Never search for a person. A profile link shown on a page is stored as a link; its page is not fetched.
- **A bot check** (Cloudflare's, for example) that blocks plain HTTP clients is read through in a real browser, as a person would see the page. Never solve or get past a challenge; if the browser is stopped too, ask the user to paste the pages.
- Public pages only. Don't sign in, submit forms or get past a paywall.

## Order

1. **Homepage**: the fund's name, one-liner, logo and links to the other pages.
2. **About / thesis**: thesis, stages, sectors, geographies, check size, locations, named funds and vintages.
3. **Team**: each person's name, title, the groups the page files them under (its filters, sections or CSS classes: "Investment team", "Founder Council"), bio, headshot and profile links, and the address of their own page on the fund's site. Then read each person's own page: their bio, and any lists of companies tied to them, recorded in the fund's words (`board_positions` for "Board positions", `related_investments` for "Related investments" or "Investments"). These lists are how a fund says who works on what; don't turn them into `lead_partner` unless the page says "lead".
4. **Portfolio**: each company's name, website, one-liner, sector, the status the page shows (active, exited, acquired), logo, partner when stated, and the fund or vehicle when the page files companies by fund (a "Fund" filter or section). Open a company's detail page on the fund's site when there is one.
5. **News** (optional, the latest page only): announced investments and exits, as round candidates.
6. **Press**, after the companies are written: the last month's stories about each company the fund may still hold (`fund_position: held`; or, when the fund's site doesn't say, not exited, acquired, listed or shut down), as `monitoring-page.md` describes for a run (one news-feed request per company, the company's name with its domain or what it does when the name is a common word; keep only headlines about this company that matter to an investor; never fetch the articles). Propose them with the rest; each becomes an `updates` record with origin `press`. Say how many companies had none.

## Reading pages well

- **Logo grids:** many portfolio pages are images only. The company's name is often in the image's `alt`, `title` or file name, or in the link it wraps. The link's target is usually the company's website, which gives `domain`.
- **Pages built by JavaScript:** if a page's text is empty but the browser shows content, use a tool that renders the page. If you can't, say which pages you could not read and ask the user to paste them. Often the page loads its list from a data file on the same site (a `/portfolio.json` or an API path named in its script): that file is the fund's own data, on its own host, and reads more reliably than the rendered page. Count it as a page.
- **Contact details the site lists** (a partner's email or phone) are not imported, even work ones; the person's page on the fund's site is the way to reach them.
- **Exits:** a "Live / Exited" filter, an "Exits" or "Realized" section, or an "exited" CSS class on a card sets `fund_position`. The company's own `status` changes only when the text names the outcome ("Acquired by X in 2023", "IPO on NASDAQ in 2021"); "Exited in 2024" leaves it null, and a greyed-out logo says nothing. List every card whose filing and text disagree.
- **Entry lines** such as "Seed in 2015" or "Secondary in 2020" go to `entry_round` and `first_invested_year`, not `stage`.
- **Links that aren't the company's site:** a card may link to Wikipedia, an acquirer or a product page. Keep such a link in `profiles` (kind `other`) and leave `website` and `domain` null, so it can't merge two companies.
- **Filters and data in the markup:** sector, location and status filters often sit as CSS classes or data attributes on each card (`sector-fintech`, `status-exited`); they are the fund's own classification and more reliable than the visible text.
- **Sector tags and filters** on the page are the fund's sectors for the company; keep its words.
- **Never infer:** no stage from a logo's position, no partner from a photo nearby, no amount from "we led", no status from silence.

## Images

For every logo and headshot you use, record a `media` reference: the absolute file URL (resolve relative URLs against the page), the page it was on, alt text (the page's, or a plain description you write: "Ferncloud logo"), and type and size when the response says. Compute a SHA-256 fingerprint only when your tool gives you the file's bytes. Prefer an SVG or the largest image offered. Don't download or re-host files.

## The fund's look

The portfolio site mirrors the fund's website so closely that the team recognises it as theirs at a glance. Measure it; don't guess it. A single property such as the `body` background on one page is not the look: one fund's homepage `body` was rose while every page people actually see was white with stone cards; reading that one rule made the site look nothing like the fund's.

### Measure, on at least two pages

Use the portfolio page and one other (about or team), in a real browser at desktop width, after the page has loaded and any cookie banner is declined. For each value, read the computed style of the element people see, not a stylesheet or a design-tool variable:

| Theme value | Where to measure it |
|---|---|
| `paper` | The colour covering most of the viewport: sample the background at several points (`elementFromPoint`, walking up to the first non-transparent background), on both pages. Not the `body` rule alone; heroes and sections paint over it. |
| `surface` | The background of the portfolio cards or panels, when it differs from `paper` |
| `ink` | The colour of body paragraphs and headings on `paper` |
| `accent` | The brand colour as the site uses it on marks: dots, active-nav markers, primary buttons, arrows |
| `accentInk` | The accent as text: link colour on `paper` if it is distinct; otherwise the accent darkened until it reaches 4.5:1 |
| `hair` | Borders of inputs and dividers; `cardBorder: false` when cards have none |
| `radius` | `border-radius` of the portfolio cards (0–16) |
| `controls` | `pill` when buttons, inputs or filter dropdowns are fully rounded (radius at least half their height) |
| `fonts.heading` | `font-family`, `font-weight`, `line-height ÷ font-size` (leading) and `letter-spacing` of the main headings (h1, section headings, card names) |
| `fonts.body` | `font-family` and `font-weight` of paragraphs |
| `labels` | `uppercase` when the navigation and small labels are set in capitals |
| `cards` | `logo` when the portfolio shows companies as large centred logos on cards |
| `logos` | `framed` when the fund's logo files are already tiles: each mark centred in its own white space (open one: a wide image with the mark in the middle third). The site then fills its tiles with them instead of shrinking them again |
| `names` | How company and people names on cards are set, when it differs from the headings: `{ "font": "body", "color": "accent" }` for names in the body face and the brand colour |
| `logo` | The fund's logo as it appears on `paper` (and a `logo-dark` media record for dark backgrounds). File names don't say which is which: a `logo-dark.svg` is often white lettering meant for dark backgrounds. Check the file itself (an SVG's `fill` colours, or the image rendered on `paper`) before choosing. When the logo is drawn in the page (an inline `<svg>`) and no file holds it (the favicon and pinned-tab icons are usually only part of the mark), there is nothing to reference: ask whether to copy that drawing into the site's files and point the `media` record at its published address, or to show the fund's name instead |

Then take a screenshot of the fund's portfolio page. It is the reference the site is checked against after publishing.

### Fonts

- A font served from Google Fonts is used as is: keep its stylesheet URL as `href`, with the weights the site uses.
- A font the fund hosts itself (a `@font-face` pointing at its own domain) or licenses from a foundry is not copied. Choose the closest Google Font by its traits, not its category: contrast between thick and thin strokes, serif shape (bracketed, wedge, slab, hairline), x-height, width and weight. Compare at the heading size in a zoomed screenshot. Useful starting points: a sturdy bracketed text serif (Cambon, Tiempos, Lyon) → Source Serif 4 or Newsreader at their bold display sizes; a high-contrast display serif (Canela, GT Super) → Fraunces or Playfair Display; a geometric sans (Circular, Graphik) → DM Sans or Plus Jakarta Sans; a grotesk (Söhne, Neue Haas) → Inter or Inter Tight.
- Keep the measured weight and leading. A substitute set at the wrong weight looks more wrong than a slightly different face at the right weight.
- Say in the proposal which fonts are substituted, for which original, and why.

### Mirror the brand, keep the site

The site keeps its own structure, keyboard use and contrast; the theme changes its colours, fonts, shapes and card style. Check every colour pair: ink on `paper` and on `surface`, and `accentInk` on `paper`, at least 4.5:1; `accent` as a mark at least 3:1. When the fund's own colour falls short, adjust it and say what you changed.

If the fund's site has no dark mode, set `"dark": false` so the portfolio site stays light as the fund's does.

Show the theme in the proposal as a table: each value, what it was measured from (page and element), and any adjustment.

## Matching

Before proposing, search the wiki for each company and person:

1. A company with the same `domain` is the same company.
2. Otherwise, the same name (ignoring case, punctuation and suffixes like Inc, GmbH, Labs) is a likely match: ask.
3. A person with the same profile URL is the same person; the same name at the same company is a likely match: ask.

Existing records win: propose only the fields that are empty or that the source now says differently, and show both values.

## Proposing

Show the user, before any write:

- the fund record;
- the team, one line each;
- the companies in batches of 25: name, domain, status, sector, partner, logo found (yes/no), and anything uncertain marked;
- what could not be read and why;
- the counts of records and media references per table.

Write each approved batch, then show the next. Keys are slugs from the domain or name (`ferncloud`, `mara-lind`); read each key to check it is free.

## Report

Pages read, pages that failed, records written per table, media references, the uncertain items left for the user, and how to run it again (the same import, which now only proposes differences).
