---
title: ui:options types the options RJSF's widgets read
description: "Eight options RJSF's widgets read, such as `format` and `yearsRange`, used to be `any` and now have fixed types in `UiSchema` and `UIOptionsType`. Rename a custom option that reuses one of those names with another type."
packages: ['@rjsf/utils']
uses: [custom-widgets, typescript, ui-schema]
schema: []
affects: [code]
related: [ui-schema-variable-needs-annotation-for-typed-options, alt-date-range-is-a-readonly-tuple]
---

## Detect

- Your custom widget reads an option named `accept`, `expandable`, `format`, `hideClearButton`, `hideNowButton`, `shape`, `stars` or `yearsRange` with a type of its own, such as `ui:format: { ... }`. The type checker rejects the uiSchema value, and reading `options.format` gives the type below.

`UiSchema` and `UIOptionsType` declare these options in both the `ui:options` and `ui:<name>` spellings:

| Option                             | Type                        |
| ---------------------------------- | --------------------------- |
| `accept`                           | `string`                    |
| `expandable`                       | `boolean`                   |
| `format`                           | `'DMY' \| 'MDY' \| 'YMD'`   |
| `hideClearButton`, `hideNowButton` | `boolean`                   |
| `shape`                            | `'star' \| 'heart'`         |
| `stars`                            | `number`                    |
| `yearsRange`                       | `readonly [number, number]` |

## Change

Rename your option, in the uiSchema and in the widget that reads it:

```diff
- 'ui:options': { format: { currency: 'USD' } },
+ 'ui:options': { moneyFormat: { currency: 'USD' } },
```

## Verify

- The uiSchema and the widget compile. Nothing changes at runtime.
- An unannotated uiSchema variable that sets `yearsRange` or `shape` may also fail; see [An unannotated uiSchema variable no longer fits the typed options](./ui-schema-variable-needs-annotation-for-typed-options.md).
- A custom alt-date widget that passes `yearsRange` on may also fail; see [A date element's range and yearsRange are readonly tuples](./alt-date-range-is-a-readonly-tuple.md).
