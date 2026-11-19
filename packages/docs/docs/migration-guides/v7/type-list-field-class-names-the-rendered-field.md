---
title: 'The rjsf-field type class on a type list names the field rendered'
description: 'The `rjsf-field-<type>` class on a field whose `type` is a list used to name its first non-null type; it now names the field rendered. Update CSS rules and tests that match the old class.'
packages: ['@rjsf/core']
uses: [markup]
schema: [type-lists]
kind: markup
noticed: test
related: [typeless-constant-options-render-a-select]
---

## Detect

- In your schema: a `type` list such as `["null", "number", "string"]` or `["null", "boolean", "string"]`.
- In your CSS, tests or DOM snapshots: an `rjsf-field-number` or `rjsf-field-boolean` class on such a field.

## Change

The `rjsf-field-<type>` class names the field rendered instead of the type the list resolves to. A `textarea` on a `['null', 'number', 'string']` is `rjsf-field-string`, and a select over `['null', 'boolean', 'string']` is `rjsf-field-string`. Both used to be named for their first non-null type.

```diff
-.rjsf-field-number textarea { min-height: 4rem; }
+.rjsf-field-string textarea { min-height: 4rem; }
```

## Verify

- Your rules and tests match the class on the rendered wrapper, and updated snapshots show `rjsf-field-string`.
