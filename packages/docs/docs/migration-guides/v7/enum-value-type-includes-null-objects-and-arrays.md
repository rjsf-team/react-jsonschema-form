---
title: 'EnumValue includes null, objects and arrays'
description: '`EnumValue`, the entry type of `ui:enumOrder`, `ui:enumDisabled` and `optgroups`, was `string | number | boolean` and now also allows `null` and objects. Handle or narrow those where you read entries, and remove casts you added to list them.'
packages: ['@rjsf/utils']
uses: [typescript, custom-widgets]
schema: []
kind: type
noticed: type-error
related: [enum-option-value-is-unknown]
---

## Detect

- In a custom widget or helper: code that reads `options.enumDisabled`, `options.enumOrder` or `optgroups` entries as primitives, such as `value.toString()`.
- In the type checker: `TS18047: 'value' is possibly 'null'.`, or, after narrowing out `null`, an error such as `TS2339: Property 'toUpperCase' does not exist on type 'string | object'.`
- In your `uiSchema`: a cast such as `as unknown as EnumValue` added to list a `null`, object or array value.

## Change

`EnumValue` is now `string | number | boolean | null | object` ([#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392)). Code that writes those lists still compiles. Handle `null`, objects and arrays where you read one, or narrow it first:

```diff
- const disabled = options.enumDisabled?.map((value) => value.toString());
+ const disabled = options.enumDisabled?.map((value) => enumOptionValueLabel(value));
```

[`enumOptionValueLabel()`](../../api-reference/utility-functions.md#enumoptionvaluelabel) spells an object or array out as JSON, where `String()` gives `[object Object]` or joins an array's items. Remove a cast you added to list one of the new value kinds.

## Verify

- Your widget compiles without casts and shows a readable label for every kind of value.
