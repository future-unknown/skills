# Company foundation model

## Profile

One or more company/legal-unit profiles. For a single company, use a stable ID such as `company`; never derive it from a mutable display name.

Current state includes name, purpose, stage, optional legal identity, jurisdiction, founding date, owners, and sources. Focused context can live in the record's Markdown `content`; use a separate page only for an independently meaningful long-form company document. Unknown legal fields remain null.

## Objectives

An objective expresses an outcome the company has chosen to pursue.

Lifecycle:

```text
draft → active → achieved
              ↘ at-risk
              ↘ cancelled
```

`at-risk` can return to `active`. `achieved` and `cancelled` are terminal unless an authored decision explains reopening.

Success measures are plain, testable statements. Tasks that advance an objective belong in work management.

## Facts

Facts separate observed current truth from working assumptions:

- `observed`: supported by named evidence;
- `declared`: explicitly stated by an authorized owner;
- `assumption`: used for planning but not established;
- `constraint`: a boundary the company has chosen or cannot avoid.

Never convert an assumption into an observed fact because it appears repeatedly. Use `valid_from`, `review_at`, and `source_paths` to preserve temporal meaning.
