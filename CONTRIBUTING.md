# Contributing

Known Skills should encode reusable business meaning without smuggling one company's private data or assumptions into another company's wiki.

## Before proposing a change

- Open or update the canonical Known product issue when working with Unknown Inc.
- For external contributions, describe the problem and intended ontology boundary in the pull request.
- Keep every skill independently useful.
- Prefer optional composition over hard dependencies.
- Use synthetic names and records only.

## Skill requirements

Every skill must:

1. use a directory name matching the `name` in `SKILL.md` frontmatter;
2. explain when to use and when not to use it;
3. read the shared CLI, data-modeling, ontology, and composition references;
4. inspect before proposing and propose before writing;
5. define canonical current-state records, meaningful event records, evidence, workflow projections, and prohibited inferences;
6. prefer schema-backed records over independent Markdown pages for queryable or actionable business state;
7. allow nullable Markdown `content` on records and prefer it over a page per row;
8. rely on record history/diff and historical table reads for prior values instead of duplicating obsolete state;
9. use direct record search first and schema-backed derived projections for specialized indexes, never Markdown lists;
10. explain where an independent Markdown page is appropriate and ensure it does not shadow structured fields;
11. attach schemas before inserting records;
12. use conditional page and record writes for updates;
13. include valid synthetic examples;
14. explain how it composes with existing skills without requiring them;
15. include verification and privacy checks.

## Schema changes

- Patch: documentation or compatible correction.
- Minor: optional fields or compatible enums/pages.
- Major: changed keys, required fields, paths, or meaning.
- Never weaken a schema or change a key silently.
- Existing records must be checked before a schema change is proposed.

## Validation

```bash
npm install
npm test
```

Validation checks skill frontmatter, JSON syntax, schema compilation, and synthetic examples.

## Pull requests

Keep changes focused. Explain the business invariant, migration impact, privacy impact, and how the skill behaves alone and in combination. By submitting a contribution, you license it under the repository's MIT License.
