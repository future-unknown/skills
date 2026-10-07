# Known Skills

Public, harness-readable skills for building a company in Known one workflow at a time.

Each skill is useful by itself. Install another when the business needs it: existing records remain canonical, optional references become stronger, and the company model grows without requiring a big-bang setup.

## Start small

| Order | Skill | What it establishes |
|---:|---|---|
| 1 | [`company-foundation`](skills/company-foundation/) | Company profile, objectives, and operating facts |
| 2 | [`work-management`](skills/work-management/) | Initiatives, tasks, decisions, and risks |
| 3 | [`relationship-management`](skills/relationship-management/) | Organizations, contacts, interactions, and introductions |
| 4 | [`customer-development`](skills/customer-development/) | Customer hypotheses, opportunities, discovery, and pilots |
| 5 | [`product-development`](skills/product-development/) | Feedback, product initiatives, and experiments |
| 6 | [`finance-and-runway`](skills/finance-and-runway/) | Budgets, cash/runway snapshots, and financial assumptions |
| 7 | [`fundraising`](skills/fundraising/) | Rounds, investor prospects, materials, and introductions |
| 8 | [`hiring`](skills/hiring/) | Roles, candidates, interviews, and hiring decisions |

This order is a recommendation, not a dependency graph. Start with any skill. Every cross-skill reference is optional and becomes available only when both concepts exist.

## How it works

Point a compatible agent harness at one skill's `SKILL.md`. The skill instructs the harness to:

1. discover or install the Known CLI;
2. establish the correct authenticated organization and environment;
3. inspect the existing wiki and its permissions;
4. propose an adapted ontology before writing;
5. wait for approval;
6. create pages, attach JSON Schemas, and optionally add synthetic bootstrap records through the existing Known CLI;
7. verify and report the resulting model.

The skills do not contain an installer and do not add commands to Known. The harness reasons; the Known CLI reads and writes.

## Install in Pi

Install the repository as a Git package:

```bash
pi install git:github.com/future-unknown/skills
```

Then invoke a skill explicitly when desired:

```text
/skill:company-foundation Review my current Known wiki and propose the smallest useful company foundation. Do not write until I approve.
```

Other Agent Skills-compatible harnesses can load a skill directory directly.

## Composition rules

- Schema-backed keyed records own the current state of the business.
- Every keyed-record update creates record history; inspect it with record history/diff or historical table reads instead of duplicating old state.
- Operationally meaningful events can be immutable structured records; they are not copies of obsolete state.
- Current table records appear in search, so the canonical collection is normally its own directory.
- Specialized indexes are schema-backed derived projections, never Markdown lists.
- A record's `content` can carry focused Markdown and render as its page; do not create a separate detail page by default.
- Separate Markdown pages remain right for long-form or cross-record narrative, strategy, process, evidence synthesis, and navigation.
- Source claims, assessments, workflow state, and canonical relationships stay separate.
- Unknown facts remain `null` or absent. A skill never invents intent, status, identity, affiliation, or commitment.
- Skills inspect and reuse before creating. They do not establish a competing canonical collection without approval.
- Cross-skill IDs are nullable. Human-readable source claims are preserved when no canonical reference exists.
- Each monetary amount carries an explicit ISO 4217 currency.
- Sensitive personal, legal, health, credential, and payment data stays out of public or broadly visible wikis.

See [`references/data-modeling.md`](references/data-modeling.md), [`references/ontology-principles.md`](references/ontology-principles.md), and [`references/composition.md`](references/composition.md).

## Repository layout

```text
references/                 shared CLI, data-modeling, ontology, and composition guidance
skills/<name>/SKILL.md      harness instructions
skills/<name>/references/   domain model and boundaries
skills/<name>/assets/       JSON Schemas and synthetic examples
scripts/validate.mjs        repository validation used by CI
```

## Status

This is an initial public seed. Schemas are intentionally small and conservative. Treat live company data as canonical and review every proposed migration.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). By contributing, you agree that your contribution is licensed under the repository's [MIT License](LICENSE).
