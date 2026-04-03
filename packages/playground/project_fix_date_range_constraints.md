---
name: Fix — Propagate formatMinimum/formatMaximum to date input min/max attributes
description: Documents the implementation of issue #3955 fix 2: surfacing formatMinimum/formatMaximum as HTML min/max on date/time inputs
type: project
---

Implemented Fix 2 from GitHub issue rjsf-team/react-jsonschema-form#3955: `formatMinimum`/`formatMaximum` schema keywords are now propagated as `min`/`max` HTML attributes on native date/time inputs.

**Why:** When using JSON Schema `format: "date"` (or `date-time`/`time`) fields, the correct schema keywords for range constraints are `formatMinimum`/`formatMaximum`, not numeric `minimum`/`maximum`. Previously these were validated by AJV (with opt-in `{ keywords: true }`) but never reflected in the HTML input, so the native browser date picker did not enforce the constraint visually.

**How to apply:** Fix is implemented entirely in `@rjsf/utils` so all themes using `BaseInputTemplate` get it automatically. No widget-level changes are needed for core, MUI, Chakra, React-Bootstrap, etc.

**Files changed:**
- `packages/utils/src/types.ts` — widened `RangeSpecType.min`/`max` from `number` to `number | string`
- `packages/utils/src/rangeSpec.ts` — when `schema.format` is `date`, `date-time`, or `time`, reads `formatMinimum`/`formatMaximum` instead of `minimum`/`maximum`
- `packages/utils/test/rangeSpec.test.ts` — 7 new tests covering all three date formats and edge cases

**Note on Fix 1:** `formatMinimum`/`formatMaximum` AJV validation is NOT enabled by default. Users still need to pass `{ keywords: true }` to `customizeValidator` manually. Fix 1 (enabling it by default) is still open.
