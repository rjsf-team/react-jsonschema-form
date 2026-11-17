---
title: setFieldValue fills in the defaults of the value it writes
description: 'Under `useDefaultIfFormDataUndefined`, `setFieldValue(path, undefined)` at a field with a `default` now fills the default in, as `setFieldValue('''', data)` did. Keep `mergeDefaultsIntoFormData` at `useFormDataIfPresent` to leave a field empty from code.'
packages: ['@rjsf/core']
uses: [form-ref, form-props]
schema: [defaults]
kind: runtime
noticed: review
related: [cleared-field-takes-a-changed-fields-default]
---

## Detect

- `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'` in your `defaultFormStateBehavior`.
- Calls to `setFieldValue(path, undefined)` in your code at a field whose schema has a `default`, where you expect the field to stay empty.
- An `undefined` in your seed that you expect to stay empty when a default arrives later.

## Change

Under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`, `setFieldValue(path, undefined)` at a field with a `default` used to leave the field empty, while `setFieldValue('', data)` filled the same field's `default` back in. Both now fill it in, as the form does for any data it holds. Only the fields the user cleared stay empty. An `undefined` that `setFieldValue()` or the seed put there also takes a default that arrives later, such as one a new `schema` prop gives an object holding the field.

A form that has to leave a field empty from code can keep `mergeDefaultsIntoFormData` at its default, `'useFormDataIfPresent'`, under which a field set to `undefined` stays `undefined`:

```diff
-<Form defaultFormStateBehavior={{ mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' }} />
+<Form defaultFormStateBehavior={{ mergeDefaultsIntoFormData: 'useFormDataIfPresent' }} />
```

## Verify

- A field you set to `undefined` from code shows its `default`, or stays empty under `'useFormDataIfPresent'`.
- Fields the user cleared still stay empty.
