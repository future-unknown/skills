# Monitoring

Instructions for an agent that keeps {{FUND_NAME}}'s portfolio current. Run them {{CADENCE}}, or when someone asks you to "run portfolio monitoring". You act for the person who connected you, with their access: follow these rules even where your access would let you do more.

**You propose; people decide.** Write only to `signals` and `runs`, apply only signals a person has accepted, add press stories to `updates` (below), and otherwise touch a record only to set its `checked_at` (below). Never change any other field of `companies`, `rounds`, `people`, `media`, `team` or `fund` on your own judgement.

## 1. Start the run

Write a `runs` record keyed by the start time in UTC (`2026-11-25T0900Z`) with status `running` and who you are acting for. Read [[portfolio]] for the rules.

## 2. Apply what was accepted

For each signal with status `accepted`, oldest first:

1. Read the target record named in `proposed` (`table`, `key`). If it changed after the signal's `detected_at` in a way that conflicts, leave the signal `accepted` and note the conflict in its content.
2. Merge `proposed.set` into it (or create it when the key is free), check it against the table's schema, and write it with the version you read.
3. Set the signal to `applied`.

## 3. Look for changes

Only public pages: the fund's own site, each company's own site, and a news search for a named company (never for a person). One request at a time.

### The page budget

At most {{PAGE_LIMIT}} pages a run for companies' own sites and media (steps 2 and 4 below). The fund's own site and the press searches (steps 1 and 3) run in full every run and don't count against it, so a large portfolio never crowds them out; they are about one page per held company plus a few for the fund. A page is one request that returns content you read: a `robots.txt`, an HTML page, a feed. A redirect followed to its end is one page. Requests that fail before answering (no DNS, timeout) count as one page each, so a dead site can't eat the run. Record every page in the run's `pages_checked`, whichever step it served.

### Order

1. **The fund's own site, every run:** its portfolio page (all of it, including "load more"), the first page of its portfolio news, and its team page. News: read posts newer than the newest fund-published update already in `updates`, and no further back. If the site blocks plain HTTP clients, read it in a browser.
2. **Companies, by `checked_at`, oldest first** (missing first; ties broken by key), until the budget is spent. Stop early enough to leave room for step 3 in the run's time. A company the fund still holds (`fund_position: held`, or `status: active`): its homepage, its newsroom or blog index, its team or about page, and any post newer than its newest update. Any other company: its homepage only.
3. **Press, every run, outside the budget:** for each company the fund holds, a news search for the company's name (with its domain or what it does when the name is a common word) over the days since the last run. A public news feed that needs no key is enough (for example Google News search as RSS: `https://news.google.com/rss/search?q=<query>+when:2d`); one request per company counts as one page. Keep a story only when its headline is about this company, not a namesake, and matters to an investor (funding, acquisitions, IPO plans, launches, partnerships, senior hires or departures, layoffs, legal matters, notable profiles); drop explainers, listicles and job ads. Write each kept story straight into `updates`: origin `press`, kind `news`, the headline as `title`, the publication as `publisher`, the date, the link in `source_paths`, and a one-line summary from the headline alone in `content`. Key: company, date and the headline's first words; skip a story whose link or headline is already there. Press changes no other record, so it needs no signal. Don't fetch the articles.
4. **Media last, with what is left:** `current` media records whose `fetched_at` is oldest, a request each. Don't fetch media on a host that blocked you this run.

### robots.txt

Read each host's `robots.txt` once per run, before its first page. If it disallows the path, skip the path. If it can't be read (an error status, a timeout, or HTML instead of rules), treat the whole host as disallowed for this run, and note it in `problems`.

### What counts as checked

Set a record's `checked_at` only when you read the pages its check needs. A company whose site failed or that you only partly read keeps its old `checked_at`, so it comes first next time. A company with no `website` has nothing to check: set its `checked_at` so it doesn't block the line, and raise no signal. A team member's `checked_at` is set when the fund's team page was read and still lists them as they are recorded.

| Check | Where | Signal |
|---|---|---|
| Companies added or removed | The fund's portfolio page, compared with `companies` and `on_fund_site` | `new-company`, `removed-company` |
| Rounds | Each company's newsroom or blog; news naming the company and an amount | `new-round` |
| Exits and shutdowns | The fund's site, the company's site, news | `exit`, `shutdown` |
| The company's own website | Its recorded address: redirects to a new domain, redirects somewhere unrelated, no longer resolves, or answers 404 | `website-changed` |
| People | The company's team or about page, compared with `people` | `person-joined`, `person-left`, `title-change` |
| Team | The fund's team page, compared with `team` | `person-joined`, `person-left`, `title-change` (subject `[[team/…]]`) |
| Images | A `current` media URL that no longer answers, or whose fingerprint (`sha256`, where recorded) changed; a new logo on the company's site | `media-broken`, `media-changed` |
| News | Anything else material about a company | `news` |

Rules:

- **Match before you raise.** Find the company by `domain`, then by name. Find an existing signal for the same change (same company, kind and source, or same proposed key) that is not closed; don't raise it twice.
- **A source per signal.** Every signal carries the page it came from in `source_paths`.
- **Propose the exact write.** For a change to a record, put `{ "table", "key", "set" }` in `proposed`, with only the fields that change, as the source states them. A round from news has `basis: public`. A website that moved to the company's new domain proposes the new `website` and `domain`; one that went somewhere unrelated or died proposes nothing. Leave `proposed` null for `news` and anything without a clear write.
- **Exits need the word.** Propose `status: acquired` only when a source says the company was acquired, bought, merged into or sold to a named buyer; `ipo` only when it says listed or IPO; `shut-down` only when it says closed or wound down. Softer wording ("part of the X Group", "joins forces with") is a `news` signal quoting it, with `proposed` null. `fund_position: exited` needs the fund's own site to say so.
- **Don't infer.** A company missing from the fund's page is `removed-company`, not an exit. A person missing from a team page is `person-left` only when the page clearly lists the team. No amounts, valuations, investors or dates the source doesn't state.
- **People:** work-related, public facts from the company's or fund's own pages. No personal contact details; don't fetch profile links.

New signals: `S-` and four digits, the highest number plus one, starting at `S-0001`; read the key to check it is free. Status `proposed`, `detected_at` now, `run` linking this run.

## 4. Finish

Update the run: `finished_at`, `status` (`completed`, or `partial` when some pages failed, or `failed`), pages checked, signals created and applied, and each page that failed and why in `problems`.

Then tell the person you act for, in a few lines: what changed, what waits for review, and what failed. The review lives in the portfolio site's Review view.
