---
title: IChangeEvent.formData and getFormData() include undefined for a scalar root
description: '`IChangeEvent.formData` and `FormRef.getFormData()` are now `EventFormData<T>`, which is `T | undefined` when the root is a string, number or boolean. Let the state you store that data in allow `undefined`.'
packages: ['@rjsf/core']
uses: [typescript]
schema: []
kind: type
noticed: type-error
related: [form-data-type-defaults-to-unknown, change-event-members-are-readonly]
---

## Detect

- In your code: a form whose root schema is a string, number or boolean, whose `onChange` or `onSubmit` stores `formData`, or whose ref's `getFormData()` result is stored, in state typed without `undefined`.
- The type checker reports `Argument of type 'string | undefined' is not assignable to parameter of type 'SetStateAction<string>'.` (TS2345), or a similar TS2322, at that call.

## Change

`IChangeEvent.formData` and `FormRef.getFormData()` are typed `EventFormData<T>`. That is `T` itself when the data is an object or array, since no change below the root replaces such a root with `undefined`, and `T | undefined` for a scalar, which is `undefined` once its field is cleared.

So `const [data, setData] = useState(initial)` with `onChange={({ formData }) => setData(formData)}` needs no annotation for an object form. For a scalar root the state has to allow `undefined`:

```diff
-const [theme, setTheme] = useState('light');
+const [theme, setTheme] = useState<string | undefined>('light');
 <Form schema={{ type: 'string' }} formData={theme} onChange={({ formData }) => setTheme(formData)} … />
```

A write at the root itself can empty an object root: `setFieldValue('', undefined)`, or a root-level custom field or widget calling `onChange(undefined, ROOT_FIELD_PATH)`. The type doesn't reflect that, and the event reaches `onChange` either way, so allow for `undefined` in the handler's state if your form does either.

## Verify

- The type checker accepts storing `formData` from a scalar-root form.
- Code that reads the stored value handles `undefined`, and a cleared scalar field renders without error.
- If your form writes `undefined` at an object root, the handler's state allows `undefined` too.
