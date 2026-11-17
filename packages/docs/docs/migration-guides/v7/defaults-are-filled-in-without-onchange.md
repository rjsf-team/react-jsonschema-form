---
title: Form no longer calls onChange on mount for defaults or null fields
description: 'The form now fills in schema defaults and `type: ''null''` values without calling `onChange`, on mount or when its schema or default options change. Read `getFormData()` or the `onSubmit` event when you need the data with its defaults.'
packages: ['@rjsf/core']
uses: [form-props]
schema: [defaults]
kind: runtime
noticed: review
related: [get-default-form-state-fills-null-fields, initial-form-data-replaces-form-data]
---

## Detect

- An `onChange` in your code that you expect to run when the form mounts, to receive the schema's defaults or a `type: 'null'` field's `null`.
- A copy of the data kept only from `onChange`, which you read before the user edits anything.
- A `type: 'null'` property in your schema that a `LayoutGridField` layout leaves out, or that sits under a `ui:field` that doesn't render it.

## Change

The form fills its seed in with the schema's defaults on mount, and again when the `schema`, a `ui:emptyValue`, `defaultFormStateBehavior` or `additionalPropertiesWhenAbsent` changes. It no longer calls `onChange` for that. v6 called `onChange` for those defaults from its constructor, and the field of a `type: 'null'` schema called `onChange(null)` as it mounted.

If you keep a copy of the data from `onChange`, that copy has no defaults until the first edit. Read `getFormData()` when you need the value with its defaults, or take it from the `onSubmit` event:

```diff
-const onChange = ({ formData }) => setData(formData);
-const save = () => api.save(data);
+const save = () => api.save(formRef.current.getFormData());
```

## Verify

- Data you read before the first edit includes the schema's defaults.
- A missing `type: 'null'` value is filled in as `null` like any other default, whatever `emptyObjectFields` says, so the submitted data is unchanged wherever that field rendered.
- A `type: 'null'` property left out of a `LayoutGridField` layout, or under a `ui:field` that doesn't render it, is now submitted as `null` where it was absent.
- An object holding a `type: 'null'` field that you set to `undefined`, with `setFieldValue()` or `transformChange`, now stays `undefined`. The field used to put its `null` back and re-create the object with its defaults.
