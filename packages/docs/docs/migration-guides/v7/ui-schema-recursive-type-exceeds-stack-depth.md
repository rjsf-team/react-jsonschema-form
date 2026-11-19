---
title: A deep uiSchema for a recursive form data type can exhaust the type checker
description: "Typed uiSchema entries now recurse with the form data, so a deeply nested literal for a self-referential type can fail with `Excessive stack depth comparing types`. Annotate the deep sub-entry as plain `UiSchema`."
packages: ['@rjsf/utils']
uses: [typescript]
schema: [refs]
affects: [code]
related: [ui-schema-rejects-field-names-not-in-form-data]
---

## Detect

- Your form data type refers to itself, such as `type TreeNode = { children: TreeNode[] }`.
- One typed uiSchema literal nests far into it, and the type checker reports `TS2321: Excessive stack depth comparing types '…' and '…'`.

## Change

Annotate the deep sub-entry as plain `UiSchema` to stop the recursion there:

```diff
- const childUi = { children: { items: { 'ui:title': 'Node' } } };
+ const childUi: UiSchema = { children: { items: { 'ui:title': 'Node' } } };
```

## Verify

- The uiSchema compiles. Entries above the annotated one are still checked against the data type; see [A typed UiSchema rejects field names the form data lacks](./ui-schema-rejects-field-names-not-in-form-data.md).
