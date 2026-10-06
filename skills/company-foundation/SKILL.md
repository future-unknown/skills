---
name: company-foundation
description: Create or improve a minimal company foundation in Known: company profile, objectives, and operating facts. Use when starting a company wiki, clarifying what the company is building, or establishing a stable base before adding work, relationships, customers, finance, fundraising, or hiring.
license: MIT
compatibility: Requires the Known CLI and permission to read and write the selected wiki.
metadata:
  version: "0.2.0"
  category: business-ontology
---

# Company foundation

Build the smallest useful company model. Do not turn this into a generic knowledge dump.

## Required reading

Resolve paths relative to this skill directory and read:

1. `../../references/known-cli.md`
2. `../../references/data-modeling.md`
3. `../../references/ontology-principles.md`
4. `../../references/composition.md`
5. `../../references/skill-run.md`
6. `references/model.md`

If a shared reference is unavailable, stop rather than guessing.

## Default model

Propose a root such as `company` with keyed collections:

- `company.profile` keyed by `id`
- `company.objectives` keyed by `id`
- `company.facts` keyed by `id`

Use the schemas in `assets/`. Adapt paths to the existing wiki instead of creating duplicates.

## Boundaries

- Profile records contain current company identity and stage, not legal-document contents.
- Objectives are intended outcomes with explicit status and success measures, not task lists.
- Facts are source-backed operating facts or explicit assumptions. Their `kind` must distinguish the two.
- Do not infer legal identity, stage, owners, dates, metrics, or targets.
- Do not create work tasks, contacts, budgets, or fundraising records; recommend the relevant optional skill.

## Run

Follow the standard skill run. Before proposing, search for existing company, strategy, goals, objectives, registry, and facts pages. Reuse the established canonical owner whenever possible.

If approved, create explanatory collection pages, attach schemas before records, and seed only facts supplied by the user or existing source-backed wiki evidence. Never import the synthetic examples as company data without explicit request.

## Composition

This skill has no dependencies. Other skills may optionally reference objective IDs. Adding them later must not move or rename company records automatically.
