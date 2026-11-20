---
title: An unannotated uiSchema variable no longer fits the typed options
description: "`yearsRange` and `shape` now have narrow types, so a uiSchema in an unannotated variable, which infers `number[]` and `string`, no longer fits. Annotate the variable as `UiSchema` or mark those values `as const`."
packages: ['@rjsf/utils']
uses: [typescript, ui-schema]
schema: []
affects: [code]
related: [ui-options-types-the-options-widgets-read]
---

## Detect

- Your TypeScript code holds a uiSchema in a variable with no type annotation, and sets `yearsRange` or `shape` in it. Inference widens `yearsRange: [2000, 2030]` to `number[]` and `shape: 'heart'` to `string`, and the type checker rejects the variable where it is passed as a uiSchema.

## Change

Annotate the variable, or mark those values `as const`:

```diff
- const uiSchema = { 'ui:options': { yearsRange: [2000, 2030] } };
+ const uiSchema: UiSchema = { 'ui:options': { yearsRange: [2000, 2030] } };
```

Don't mark the whole uiSchema `as const`. That also makes arrays such as `ui:order` and `ui:enumNames` read-only, which don't fit.

## Verify

- The uiSchema compiles. Nothing changes at runtime. The option types are listed in [ui:options types the options RJSF's widgets read](./ui-options-types-the-options-widgets-read.md).
