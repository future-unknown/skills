# Known CLI bootstrap and discovery

Read this before using any ontology skill. The installed CLI's public help and actual responses are authoritative; this reference defines the safe discovery sequence.

## 1. Discover the CLI

Check without modifying the machine:

```bash
command -v known
known help
```

If `known help` is unavailable, try the bare `known` command. Do not inspect CLI implementation code to infer behavior.

Confirm that the installed CLI exposes organization-scoped wiki operations. Required capabilities are page reads/writes, tree/search, metadata/schema updates, keyed record reads/writes, record history/diff/links, historical table reads, and wiki discovery. If a required capability is missing, stop and explain which capability is unavailable.

## 2. Install when absent

Installation changes the user's machine, so explain the supported command and obtain approval first.

The Known CLI is currently distributed from its Git repository to authorized users. Check these prerequisites:

- Git
- Node.js 18 or newer
- SSH access to `future-unknown/known`
- permission to install or link an npm package

Supported installation:

```bash
git clone git@github.com:future-unknown/known.git
cd known
npm install
npm install -g .
known help
```

If repository access fails, do not invent an alternative package or ask for keys, tokens, passwords, or passphrases. Explain that CLI repository access is required and stop. Update this reference when Known's distribution model changes.

## 3. Discover or establish a session

```bash
known sessions
known whoami
```

A session binds endpoint, organization, account, and tokens. Never treat the endpoint as a global mode and never silently choose among sessions.

If no suitable session exists, confirm the intended environment before invoking login:

```bash
known login                    # production by default
known login --endpoint staging # staging only when explicitly intended
```

The user completes browser authentication. Never read, copy, print, or persist session files or tokens.

When the same organization exists on several environments, use an explicit name such as `acme@staging`.

Verify the selected session:

```bash
known <session> ping
known <session> whoami
```

If authentication expired, preserve the CLI's exact recovery instruction and wait for the user to complete it.

## 4. Discover wikis and commands

Use public command menus instead of remembered syntax:

```bash
known <session>
known <session> wiki
known <session> wiki wikis
```

Confirm:

- target wiki;
- visibility and user access;
- intended root path;
- permission to read, author pages, change metadata, and write records.

Distinguish an absent page from a forbidden wiki, expired session, unsupported command, or ambiguous session.

## 5. Inspect safely

Start bounded and targeted:

```bash
known <session> wiki tree <path> --depth 2 --json
known <session> wiki search "<concept>" <path> --json
known <session> wiki get <path> --json
known <session> wiki data <path> --limit 20 --json
known <session> wiki history <table>/<key> --limit 10 --json
known <session> wiki diff <table>/<key> --json
known <session> wiki links <table>/<key> --json
```

Search now returns both pages and current table records. A record hit has `kind: "record"`, its key, heading, and address; logs are not searched. Use record search instead of loading all rows merely to find a name or phrase.

A keyed table record has its own retained versions. Address it as `<table>/<key>` for `history`, `diff`, and `links`. Use `wiki data <table> --at <iso>` to read the table as it stood at a moment. An `unknown` key in a historical read means an older version was not retained; it does not prove the record was absent.

Do not load an entire large wiki when a targeted read answers the question. Reuse reads instead of repeatedly fetching the same tree.

## 6. Write safely

- Read a page before changing it and retain `revisionId`.
- Use `wiki set --if-revision` for existing pages.
- Inspect existing metadata before changing a key or schema.
- Attach and validate schemas before inserting records.
- Let table schemas accept nullable string `content` when a record may need focused Markdown writing.
- Prefer record `content` over creating a record plus a detail page; record writing is limited to 16 KB.
- Use stable keyed records and `wiki put --if-version` for updates.
- Read the resulting record history/diff when verifying a state transition.
- Search for the record when validating discoverability; do not create a parallel Markdown index by default.
- Use wikilinks to record addresses and `wiki links` for reverse relationships instead of copying related data.
- Never treat a refusal as an empty result.
- Re-read every changed page or record before reporting success.

A skill must propose its exact writes and wait for approval before applying them unless the user explicitly requested immediate application with sufficient scope.
