---
title: An anyOf or oneOf option naming no type takes its field's type for the Optional Data Controls
description: The Optional Data Controls used to read a field's type from its `anyOf`/`oneOf` options alone, and now give a typeless option the field's type, so such a field renders behind Add. Turn the controls off for that field to keep the old rendering.
packages: ['@rjsf/core']
uses: [ui-schema]
schema: [any-of-one-of, arrays]
kind: runtime
noticed: test
related: [optional-object-holding-empty-object-renders-open]
---

## Detect

- Your `enableOptionalDataFieldForType` names `object` or `array`.
- An optional field of that type has `anyOf`/`oneOf` options that name no type of their own, such as `{ "type": "object", "properties": { "a": { "type": "string" }, "b": { "type": "string" } }, "oneOf": [{ "required": ["a"] }, { "required": ["b"] }] }`.
- On the rendered page or in tests, that field now shows only an Add button where it showed its fields and the option selector ([#5360](https://github.com/rjsf-team/react-jsonschema-form/issues/5360)).

## Change

An option naming no type now takes the field's own, as the option `MultiSchemaField` renders already did, so the field renders behind its Add button and nothing else until it is clicked.

To keep the old rendering, leave the field's type out of `enableOptionalDataFieldForType`, or set [`ui:enableOptionalDataFieldForType`](../../api-reference/uiSchema.md#enableoptionaldatafieldfortype) to `[]` in that field's uiSchema to turn the controls off for that field alone:

```diff
 const uiSchema = {
-  pick: {},
+  pick: { 'ui:enableOptionalDataFieldForType': [] },
 };
```

Marking the field `ui:required` would render it as before too, but it also keeps the form from submitting while the field is empty.

## Verify

- An optional array whose `anyOf` options are `minItems`/`maxItems` bounds now hides the option selector until Add is clicked, unless its defaults fill it. The first option's `minItems: 1` does under the default `arrayMinItems`, which renders the array with its items and a Remove button.
- Options naming several types still get no controls, a `null` option beside another type included: `{ "type": ["object", "null"], "anyOf": [{ "required": ["a"] }, { "type": "null" }] }` renders as before.
- A `ui:required` property of such an object is not reported while the object has no value.
- While such an object has no value, none of its `type: 'null'` properties get their `null`s in the defaults.
