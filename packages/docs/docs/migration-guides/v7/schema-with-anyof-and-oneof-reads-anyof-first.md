---
title: 'A schema with both anyOf and oneOf reads anyOf first everywhere'
description: 'Parts of RJSF read `oneOf` before `anyOf` on a schema with both, so it could render one list and decide from the other. Everything now reads `anyOf` first; give both keywords the same options or drop one.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, markup]
schema: [any-of-one-of]
kind: runtime
noticed: test
related: [typeless-constant-options-render-a-select]
---

## Detect

- In your schema: a node with both `anyOf` and `oneOf`.
- In your tests or CSS: an option selector id ending in `__oneof_select` on such a node.
- In your `uiSchema`: option labels or per-option settings under `oneOf` for such a node.
- On the rendered page: the error `schema cannot be inferred as a constant` during render.

## Change

`optionsList()` and the option selector read `anyOf` before `oneOf`. `isSelect()`, `sanitizeDataForNewSchema()`, `BooleanField`, the `LayoutGridField` path (`findFieldInSchema()`, `LayoutMultiSchemaField`), the defaults `getDefaultFormState()` computes, the `ui:required` check, `retrieveSchema()`'s option resolution and `getClosestMatchingOption()`'s scoring of nested properties read `oneOf` first ([#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309)). They now all read `anyOf` first through the new `getXxxOfKey()` utility, and an empty `anyOf: []` gives way to a non-empty `oneOf`.

As a result:

- A constant default comes from the `anyOf` options on screen, and a `ui:required` field inside the rendered `anyOf` option is reported.
- The selector's `id` suffix is `__anyof_select`, where it used to be `__oneof_select` whenever a `oneOf` was present.
- Its options take their labels and per-option `uiSchema` from `uiSchema.anyOf`, where they came from `uiSchema.oneOf`.
- A schema with constant options under both keywords renders the `anyOf` options. One whose `anyOf` options aren't all constants renders that `anyOf`'s option selector, where it used to render a select of the `oneOf` constants.

Give the two keywords the same options, or drop the redundant one:

```diff
 {
   "anyOf": [{ "const": "a" }, { "const": "b" }],
-  "oneOf": [{ "const": "a" }, { "const": "b" }]
 }
```

A schema with only one of the two keywords is unaffected.

## Verify

- The node renders one list of options, its defaults and `ui:required` checks follow that list, and your selectors match `__anyof_select`.
