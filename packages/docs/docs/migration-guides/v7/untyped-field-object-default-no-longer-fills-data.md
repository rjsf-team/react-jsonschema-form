---
title: An untyped field's object default no longer fills in keys its data lacks
description: 'A field with no `type` and an object `default` used to merge that default into its object data; once the form has generated its defaults, the data now stands as it is. Give the field `type: ''object''` and per-property defaults to keep the keys filled in.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [defaults, type-lists]
affects: [data]
related: []
---

## Detect

- In your schema, a field with no `type` whose `default` is an object.
- In your form data, an object for that field that lacks some of the default's keys.

## Change

Once the form has generated its defaults (`initialDefaultsGenerated`), `getDefaultFormState()` keeps an untyped field's object data as it stands, as it already did for a `type: 'object'` field. With `{ default: { a: 1 } }` and data `{ b: 2 }`, the result used to be `{ a: 1, b: 2 }` and is now `{ b: 2 }`. Object data the field can't take, such as one its `allOf` types as a string, still takes its defaults.

To keep filling those keys, give the field a type and declare them as properties with defaults ([#5523](https://github.com/rjsf-team/react-jsonschema-form/issues/5523)):

```diff
 const schema: RJSFSchema = {
-  default: { a: 1 },
+  type: 'object',
+  properties: { a: { type: 'number', default: 1 } },
 };
```

## Verify

- The field's data shows the default's keys where you declared them as properties.
