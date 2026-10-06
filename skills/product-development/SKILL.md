---
name: product-development
description: Create or improve a product-learning workflow in Known for feedback, product initiatives, and experiments. Use when turning observed user problems into evidence-backed product work while keeping observations, hypotheses, decisions, and implementation separate.
license: MIT
compatibility: Requires the Known CLI and permission to read and write the selected wiki.
metadata:
  version: "0.2.0"
  category: business-ontology
---

# Product development

Build a learning system, not a feature-request inbox that silently becomes a roadmap.

## Required reading

Read:

1. `../../references/known-cli.md`
2. `../../references/data-modeling.md`
3. `../../references/ontology-principles.md`
4. `../../references/composition.md`
5. `../../references/skill-run.md`
6. `references/model.md`

## Default model

Propose a root such as `product` with:

- `product.feedback` keyed by `id`
- `product.initiatives` keyed by `id`
- `product.experiments` keyed by `id`

Use bundled schemas. Inspect existing feedback, roadmap, issue, research, experiment, and architecture pages before writing.

## Boundaries

- Feedback preserves observed or reported behavior and provenance.
- Cause and solution remain hypotheses until tested.
- Product initiatives own product outcomes and commitment state.
- Experiments own a falsifiable hypothesis, method, success threshold, and result.
- Implementation notes stay on relevant architecture or roadmap pages rather than being embedded in feedback records.
- A customer request, investor suggestion, or repeated complaint does not automatically become a committed initiative.

## Composition

Works alone. It may reference customer opportunities/discovery and work initiatives when those skills exist. Product records preserve source paths and do not copy private customer evidence into a more visible wiki.
