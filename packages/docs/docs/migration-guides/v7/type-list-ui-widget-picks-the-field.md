---
title: 'A type list renders the field of the type its ui:widget belongs to'
description: 'A `type` list that resolves to `object` or `array` used to ignore a `ui:widget` such as `textarea`, or throw. It now renders the field of the type that has the widget; remove the `ui:widget` to keep the object or array field.'
packages: ['@rjsf/core']
uses: [ui-schema]
schema: [type-lists]
kind: runtime
noticed: review
related: [type-list-field-class-names-the-rendered-field]
---

## Detect

- In your schema: a `type` list such as `["null", "object", "string"]` or `["array", "string"]`.
- In your `uiSchema` for that field: a `ui:widget` that belongs to another type it lists, such as `textarea`.
- On the rendered page: the field is a textarea where it used to be an object field, or the form renders where it used to throw `No widget 'textarea' for type 'array'`.

## Change

`['null', 'object', 'string']` with `ui:widget: 'textarea'` rendered `ObjectField`, and `['array', 'string']` threw. Both now render the field of the type that has the widget, here `StringField`, and fill in no defaults for the object's properties. A value that is already an object or an array stays in its own field, which ignores the widget. `resolveWidget()` follows the same rule and returns `TextareaWidget` for those schemas instead of throwing.

To keep the object or array field, remove the `ui:widget`:

```diff
 const uiSchema = {
-  note: { 'ui:widget': 'textarea' },
 };
```

## Verify

- The field renders the widget you set, or the object or array field once you remove it.
- An object or array value already in the data still renders in its own field.
