---
title: A typed ui:options no longer accepts field or the other root-only keys
description: A typed `ui:options` used to accept `field`, `fieldReplacesAnyOrOneOf`, `definitions` and `globalOptions`, and now rejects them. Move the keys out, and drop the first two from a `getUiOptions()` result you pass on.
packages: ['@rjsf/utils']
uses: [typescript, ui-schema]
schema: []
affects: [code]
related: [ui-options-field-and-reserved-keys-move-out]
---

## Detect

- The type checker reports `Type 'string' is not assignable to type 'undefined'.` (or `Type 'true'` or `Type '{}'` for the value given) at a `field`, `fieldReplacesAnyOrOneOf`, `definitions` or `globalOptions` key inside a typed `ui:options`.
- The type checker reports `Type 'UIOptionsType<…>' is not assignable to type 'UIOptionsType<…> & NotInUiOptions'.`, with `Types of property 'field' are incompatible.`, at `'ui:options': getUiOptions(uiSchema)` or another `getUiOptions()` result handed to `ui:options`, which can hold a `field` and a `fieldReplacesAnyOrOneOf`.

## Change

For a literal, move the keys out of `ui:options`, as [Move field, fieldReplacesAnyOrOneOf, definitions and globalOptions out of ui:options](./ui-options-field-and-reserved-keys-move-out.md) shows. For a `getUiOptions()` result, leave those two out:

```diff
- 'ui:options': getUiOptions(uiSchema),
+ const { field, fieldReplacesAnyOrOneOf, ...options } = getUiOptions(uiSchema);
+ 'ui:options': options,
```

## Verify

- The uiSchema compiles.
