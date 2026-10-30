# Reaching Known

Read this before using any skill. Skills say what to do in Known; this reference says how to find the way in that your agent has, and how to use it safely. Whatever you discover is authoritative: the descriptions Known gives its tools, the instructions it sends when an agent connects, and the CLI's own help. This reference never names a tool or a command, because they change; discover them each time.

## 1. Find your way into Known

An agent reaches Known in one of two ways:

- **Known's tools, connected to the agent** (Known's MCP server, for example in Claude, ChatGPT, Cursor, Codex or Claude Code). If you have tools from Known, use them. They act as the person who connected them, in the organizations they chose.
- **The `known` CLI**, for an agent with a terminal. Check without changing the machine: `command -v known`, then its help.

Prefer the tools when you have both; use the CLI when the tools are missing a capability you need.

If you have neither, don't install anything, and don't send the user away or to a new chat. Known is usually connected to their account but not switched on for this conversation: tell them how to switch it on right here, then continue when they say so.

- **ChatGPT:** start the next message with "Known", or choose Known from the + menu in the message box. ChatGPT uses an app only in the messages it is selected for.
- **Claude:** + in the message box → Connectors → turn on Known, for this chat.
- **Cursor, Codex, Claude Code and others:** Known appears among the agent's MCP servers; it may need to be enabled or signed in there.

Only when Known isn't connected to their account at all, give the one-time steps for their assistant (https://known.info/docs/connect-agent has each), and continue in this chat once it's done. Never ask for keys, tokens or passwords, and never read, copy, print or keep session files or tokens.

When the user says Known is connected but you still have no tools from Known, say exactly that and give the steps above for switching it on in this chat; don't repeat a general request to connect it.

## 2. Discover what you can do

Before a skill's first step, list what your way in offers: the tools you were given, with their descriptions and parameters, or the CLI's command menus. For each capability the skill needs, find the operation that does it by its name and description, and note it. Don't assume a name from memory or from another agent.

The capabilities skills use:

- **Wikis:** list the wikis you can use, with what each is for and who reads it; create a wiki.
- **Pages:** read a page with its metadata (its key and schema) and its revision; see a wiki's page tree; search pages and records; write a page; edit part of a page; change a page's properties (its key, schema and description).
- **Records:** list a table's records; read one record by its key; write a record, with the version it was read at; read a record's history and what links to it; read a table as it stood at a time.
- **Code trees and sites** (only skills that publish a site): create a tree; write and read its files; pin a package; check the tree for problems; register a site with a tree as its source; let it read a wiki; publish it.

If a capability a skill needs is missing from every way in you have, stop before writing and tell the user which one, and what it is for. Don't work around it.

## 3. Know where you are

- **Which organization:** tools name the organizations you may reach; a CLI session names one. When there is more than one, ask which to use; never choose silently. When the same organization exists on more than one environment (production and staging), confirm which the user means.
- **Who you are and what you may do:** the account, and your level in each wiki (read, write, change metadata, manage). Distinguish an absent page from a forbidden wiki, an expired sign-in, and an operation you don't have.
- **Addresses:** use the form your way in documents. Every page belongs to a wiki, and every record to a table page, addressed by its key.

If a sign-in has expired, pass on Known's exact recovery instruction and wait for the user.

## 4. Inspect safely

Start bounded and targeted: a wiki's tree to a small depth, a search for the concept, the page you need with its metadata, a few records. Search returns pages and current table records; use it instead of loading every row to find a name. Logs are not searched.

A keyed record keeps its versions: read its history to see how it changed, and read the table as it stood at a time when the question is about the past. A key missing from an old read means that version wasn't kept, not that the record didn't exist.

Don't load a whole wiki when a targeted read answers the question, and reuse what you have read.

## 5. Write safely

- Read a page before changing it, and write it back with the revision you read.
- Inspect a page's metadata before changing its key or schema; attach the schema before inserting records.
- Let table schemas accept nullable string `content` when a record may need Markdown writing, and prefer it over a page per record (record writing is limited to 16 KB).
- Update a keyed record in place, with the version you read. Writing a record replaces any record with the same key, so read a new key first to check it is free.
- Use wiki links (`[[path/key]]`) for relationships, and what-links-here for the reverse, instead of copying data.
- Never treat a refusal as an empty result. Re-read every page or record you changed before reporting success.

Propose the exact writes and wait for approval before applying them, unless the user explicitly asked for them to be applied with enough scope.

## 6. Code trees and sites

Some skills publish an interface: a site in Known that signs people in with Known and reads the wikis attached to it.

- A **code tree** holds the site's files with history. Every write reports the tree's problems so far (files that don't parse, imports that resolve to nothing, packages not pinned); check the whole tree before publishing.
- A **site** names its tree as its source, reads only the wikis attached to it, and is published at its own address. Publishing writes the site's sign-in settings into each page; publishing an earlier change puts that version back. A site sees a newly attached wiki once it is published again.
- Registering a site, attaching a wiki and publishing change what the organization's members can reach: propose them like any other write and wait for approval. Who may use a site is managed in Known.
- Site files are public; the data stays behind each person's sign-in and their own access to the wiki.
