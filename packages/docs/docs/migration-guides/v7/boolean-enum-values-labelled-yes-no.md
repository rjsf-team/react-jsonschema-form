---
title: 'A boolean field labels its enum values and empty-titled constants differently'
description: 'A boolean `enum` other than an unnamed `[true, false]` used to label its values `true`/`false`, and an empty-titled constant read Yes or No. Now every unnamed value reads Yes/No and an empty title stays empty; name values with `ui:enumNames`.'
packages: ['@rjsf/core']
uses: [form, markup]
schema: [enums]
kind: runtime
noticed: test
related: [ui-enum-order-orders-booleans-and-constant-options, labelled-boolean-constant-options-default-to-a-select]
---

## Detect

- In your schema: `"type": "boolean"` with an `enum` such as `[true]` or `[true, false, null]`, and no `ui:enumNames` naming its values.
- In your schema: a boolean constant option with `"title": ""`.
- On the rendered page, in tests or snapshots: that field's options read Yes, No and `null` where they read `true`, `false` and `null`, or an empty label where they read Yes or No.
- In a custom widget: `options.enumOptions` labels are `Yes`/`No` instead of `true`/`false`.

## Change

A `type: 'boolean'` field labels every `true` and `false` in its `enum` that `ui:enumNames` doesn't name with the translated Yes/No, as it already labelled untitled boolean constants ([#5319](https://github.com/rjsf-team/react-jsonschema-form/issues/5319)). Only an unnamed two-value `enum` of `true` and `false` read Yes/No before. The labels are in the `enumOptions` passed to whatever widget renders the field, so a select, radios or a custom widget reading `options.enumOptions` shows them.

A constant option whose `title` is `""` now has an empty label, since `BooleanField` reads its options through `optionsList()`, which keeps an empty title for every other type ([#4448](https://github.com/rjsf-team/react-jsonschema-form/issues/4448)). Drop the empty `title` to keep Yes or No.

To keep other labels, name the values:

```diff
 const uiSchema = {
   agree: {
+    'ui:enumNames': ['true', 'false', 'null'],
   },
 };
```

`ui:enumOrder` now applies to these options too; see [ui:enumOrder now orders boolean options](./ui-enum-order-orders-booleans-and-constant-options.md).

## Verify

- The options read the labels you named, or Yes/No in the form's language.
- Tests and snapshots that matched `true`/`false` option text are updated and pass.
