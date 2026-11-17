---
title: A ref to Form holds a FormRef handle, not the class instance
description: 'Form is a function component, so its ref exposes `FormRef<T>` and no longer has `state`, `setState` or `formElement`, and `FormState` is gone. Type the ref as `FormRef<T>` and read data with `getFormData()` and errors from callback events.'
packages: ['@rjsf/core']
uses: [form-ref, typescript]
schema: []
kind: removal
noticed: type-error
related: [reset-goes-back-to-the-seed, form-ref-validate-takes-only-the-data, form-ref-needs-form-data-type]
---

## Detect

- `useRef<Form<` or `createRef<Form<` in your code.
- `FormState` imported from `@rjsf/core` in your code.
- `.state.formData`, `.state.errorSchema`, `.state.errors`, `.state.schemaUtils`, `.state.registry`, `.setState(` or `.formElement` read through a `Form` ref in your code.
- Type checker: `Property 'state' does not exist on type 'FormRef<MyData>'.` (TS2339), or the same for `setState` or `formElement`, and `Module '"@rjsf/core"' has no exported member 'FormState'.` (TS2614).

## Change

`Form` is now a function component. Its ref exposes `FormRef<T>` instead of a class instance. `FormState`, the class component's state type, is no longer exported. `IChangeEvent` is the public shape of what reaches your callbacks.

First, change the ref's type. Use your form-data type in place of `MyData`:

```diff
-import Form from '@rjsf/core';
+import Form, { type FormRef } from '@rjsf/core';

-const formRef = useRef<Form<MyData>>(null);
+const formRef = useRef<FormRef<MyData>>(null);
```

The same change applies to `createRef`. Then replace any access to class internals:

| If your code uses…                      | Change it to…                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formRef.current.state.formData`        | `formRef.current.getFormData()`                                                                                                                    |
| `.state.errorSchema` or `.state.errors` | Read `event.errorSchema` or `event.errors` in `onChange`/`onSubmit`.                                                                               |
| `.setState(...)`                        | Call `.setFieldValue(path, value)`, or `.setFieldValue('', data)` to replace the whole value.                                                      |
| `.state.schemaUtils`                    | Use `registry.schemaUtils` in a custom field, or create one with `createSchemaUtils({ validator }, schema)`.                                       |
| `.state.registry`                       | Use the `registry` prop in a custom field, widget or template. Outside Form, use `buildRegistry(props, schemaUtils.getRootSchema(), schemaUtils)`. |
| `.formElement`                          | Use `.reset()` if you need to reset the form. The handle does not expose the DOM element.                                                          |

For example, save the data using the handle and keep error information from events:

```diff
-const data = formRef.current.state.formData;
+const data = formRef.current.getFormData();

-const errors = formRef.current.state.errors;
+const onChange = (event) => setErrors(event.errors);
```

`submit()`, `setFieldValue()`, `validateForm()`, `validateFormWithFormData()` and `focusOnError()` keep their existing signatures. `reset()` takes an optional seed, see [reset() goes back to the seed](./reset-goes-back-to-the-seed.md). `validate()` changed separately, see [FormRef.validate() takes only the data](./form-ref-validate-takes-only-the-data.md).

## Verify

- The type checker no longer reports TS2339 for `state`, `setState` or `formElement` on `FormRef`, or TS2614 for `FormState`.
- No code reads `.state`, `.setState` or `.formElement` through the ref.
- Data you save through the ref matches what the form shows.
- Error lists you kept from `.state.errors` now update from your `onChange` or `onSubmit` handler.
