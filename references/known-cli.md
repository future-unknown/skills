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
known <session> wiki tree <wiki>:<path> --depth 2
known <session> wiki search "<concept>" <wiki>:<path> --json
known <session> wiki read <wiki>:<path> --json
known <session> wiki records <wiki>:<path> --limit 20 --json
known <session> wiki get <wiki>:<table>/<key> --json
known <session> wiki history <wiki>:<table>/<key> --json
known <session> wiki diff <wiki>:<table>/<key> --json
known <session> wiki links <wiki>:<table>/<key> --json
```

Every path names its wiki: `product:issues` is the page `issues` in the wiki `product`, and `product:issues/ISS-014` is one of its records. `wiki read --json` returns a page's metadata, including its key and schema.

Search now returns both pages and current table records. A record hit has `kind: "record"`, its key, heading, and address; logs are not searched. Use record search instead of loading all rows merely to find a name or phrase.

A keyed table record has its own retained versions. Address it as `<table>/<key>` for `history`, `diff`, and `links`. Use `wiki records <wiki>:<table> --at <iso>` to read the table as it stood at a moment. An `unknown` key in a historical read means an older version was not retained; it does not prove the record was absent.

Do not load an entire large wiki when a targeted read answers the question. Reuse reads instead of repeatedly fetching the same tree.

## 6. Write safely

- Read a page before changing it and retain `revisionId`.
- Use `wiki write --if-revision` for existing pages.
- Inspect existing metadata before changing a key or schema.
- Attach and validate schemas before inserting records.
- Let table schemas accept nullable string `content` when a record may need focused Markdown writing.
- Prefer record `content` over creating a record plus a detail page; record writing is limited to 16 KB.
- Use stable keyed records and `wiki set --if-version <_v>` for updates. `wiki set` on a table replaces any record with the same key, so `wiki get` a new key first to check it is free.
- Read the resulting record history/diff when verifying a state transition.
- Search for the record when validating discoverability; do not create a parallel Markdown index by default.
- Use wikilinks to record addresses and `wiki links` for reverse relationships instead of copying related data.
- Never treat a refusal as an empty result.
- Re-read every changed page or record before reporting success.

A skill must propose its exact writes and wait for approval before applying them unless the user explicitly requested immediate application with sufficient scope.

## 7. Sites and code trees

Some skills also publish an interface: a site in Known that signs people in with Known and reads the wikis attached to it. Discover the commands from their menus: `known <session> sites --help` and `known <session> code`.

- A **code tree** holds the site's files with history: `code create <tree>`, `code write <tree>:<path> --file <local>`, `code check <tree>` (files that don't parse, imports that resolve to nothing, packages not pinned).
- A **site** is registered with `sites create "<name>" --source code:<tree>`, given wikis with `sites attach <site> <wiki>`, and published with `sites publish <site>`. Publishing serves the tree at the site's address and writes its sign-in settings into each page. `sites publish <site> --change <id>` puts an earlier change back.
- Registering a site, attaching a wiki and publishing change what the organization's members can reach. Propose them like any other write and wait for approval.
- Site files are public; the data stays behind each person's sign-in and their own access to the wiki.

