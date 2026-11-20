---
title: An array of item errors is keyed by index
description: 'An array of item errors in `extraErrors`, a field raise or `customValidate` is now handled as an object keyed by index, and the `errorSchema` RJSF passes on keys items the same way. Read such a node by index instead of with `.map()` or `.length`.'
packages: ['@rjsf/core']
uses: [form-props, custom-templates, custom-fields]
schema: [arrays]
affects: [code, data]
related: [typed-error-schema-matches-the-error-tree]
---

## Detect

- In your `onChange`, `onSubmit`, template or field code: the `errorSchema` node of an array field read as an array, such as `errorSchema.tags.map(...)` or `errorSchema.tags.length`.
- In your `extraErrors`, a field's raise or a `customValidate` result: an array holding the errors of an array field's items, which an untyped error schema still accepts.

## Change

RJSF now handles an array of item errors as the object keyed by index, so its errors are listed, block the submit and reach `onError` ([#3827](https://github.com/rjsf-team/react-jsonschema-form/issues/3827)). The `errorSchema` passed to `onChange`, `onSubmit` and the templates keys those items by index as well.

Read the node by index:

```diff
-const tagMessages = errorSchema.tags?.map((item) => item?.__errors);
+const tagMessages = Object.values(errorSchema.tags ?? {}).map((item) => item?.__errors);
```

A typed error schema has to key the items by index too; see [A typed ErrorSchema matches the tree RJSF builds](./typed-error-schema-matches-the-error-tree.md).

## Verify

- Item errors you supply as an array show on the matching items, appear in the error list, block submit and reach `onError`.
- Code that reads an array field's error node finds the item errors under the keys `0`, `1` and so on.
