---
title: Form data is deep-frozen in development
description: In development, the `formData` passed to `onChange` and the object you seed the form with are now deep-frozen, so mutating them throws. Change a copy of the data instead of mutating it in place.
packages: ['@rjsf/core']
uses: [form-props]
schema: []
affects: [code]
related: [callback-form-data-and-retrieved-schemas-are-shared]
---

## Detect

- Code that mutates `event.formData` in an `onChange` handler, for example `event.formData.name = 'x'`.
- Code that keeps mutating the object you passed as `initialFormData` or `formData`, such as v6's `this.state.data.address.city = 'x'`.
- The browser console or a test in development: a `TypeError` saying a property can't be assigned on a frozen or read-only object.

## Change

In development the `formData` passed to `onChange` is deep-frozen, so mutating it throws instead of silently corrupting your state. Only plain objects and arrays are frozen. The seed object, `initialFormData` or `formData`, is frozen too from the form's first edit, validation, submit or reset on, since the form's data shares it. All of it is frozen except the objects and arrays the form filled a default into, which it copied. Change a copy instead:

```diff
 const onChange = ({ formData }) => {
-  formData.address.city = 'x';
-  setData(formData);
+  setData({ ...formData, address: { ...formData.address, city: 'x' } });
 };
```

For retrieved schemas shared with callbacks, see [Callback form data and retrieved schemas are shared](./callback-form-data-and-retrieved-schemas-are-shared.md).

## Verify

- No `TypeError` about a frozen object in development.
- The data you store changes only through copies, and the form shows the values you set.
