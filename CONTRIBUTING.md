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
3. read the shared CLI and ontology references;
4. inspect before proposing and propose before writing;
5. define canonical records, evidence, workflow projections, and prohibited inferences;
6. attach schemas before inserting records;
7. use conditional page and record writes for updates;
8. include valid synthetic examples;
9. explain how it composes with existing skills without requiring them;
10. include verification and privacy checks.

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
