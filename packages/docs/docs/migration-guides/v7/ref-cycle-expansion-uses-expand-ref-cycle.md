---
title: Expanding a $ref cycle in a custom field uses expandRefCycle
description: 'Which `$ref` cycles are expanded is now form state, and `retrieveSchema()` no longer reads `RJSF_REF_CYCLE_KEY: false` as an expansion. A custom field that wrote that flag calls `expandRefCycle(schema, rootSchema)` from `@rjsf/utils` instead.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-fields, markup]
schema: [refs]
kind: runtime
noticed: review
related: [sanitize-keeps-or-drops-values-by-field-tree, ui-required-and-omit-extra-data-read-option-on-screen]
---

## Detect

- In your code: `{ ...schema, [RJSF_REF_CYCLE_KEY]: false }` or any write of `RJSF_REF_CYCLE_KEY` to expand a field.
- Tests that expand a recursive `$ref` field, remount the field, and expect the Expand button again.

## Change

`CyclicSchemaField` reads which fields are expanded from the form and renders an expanded one from `expandRefCycle(schema, rootSchema)`, which `@rjsf/utils` exports. `retrieveSchema()` no longer reads `RJSF_REF_CYCLE_KEY: false` on a copy of a flagged schema as an expansion: the copy is resolved like any other copy of the field it was made from, keeping its `$ref` path, so its recursion collapses where the field's would.

```diff
-import { RJSF_REF_CYCLE_KEY } from '@rjsf/utils';
-const expanded = { ...schema, [RJSF_REF_CYCLE_KEY]: false };
+import { expandRefCycle } from '@rjsf/utils';
+const expanded = expandRefCycle(schema, registry.rootSchema);
```

An expansion now survives the field remounting. With `t: { $ref: node }` and `node = { type: 'object', properties: { name: { type: 'string' }, child: { $ref: node } } }`, click `#root_t_child__expand`, then render the form with `t: { 'ui:field': Nothing }` and again without it. Before: `#root_t_child__expand` again. After: `root_t_child_name` and `#root_t_child_child__expand`, as before the remount. Update tests that expected the collapsed field.

The expanded cycles also decide what sanitizing, `ui:required` and `omitExtraData` read; see [Form keeps or drops a value by comparing the field trees before and after a change](./sanitize-keeps-or-drops-values-by-field-tree.md).

## Verify

- Your custom field's expansion renders the next level of the cycle.
- No code writes `RJSF_REF_CYCLE_KEY`.
