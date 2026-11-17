---
title: A bare FormRef types the form data as unknown
description: A `FormRef` with no type argument now means `FormRef<unknown>` and can make `Form` infer `unknown` even when `formData` is typed. Give the ref your data type, as in `useRef<FormRef<MyData>>(null)`.
packages: ['@rjsf/core']
uses: [typescript, form-ref]
schema: []
kind: type
noticed: type-error
related: [form-data-type-defaults-to-unknown, form-ref-is-a-formref-handle]
---

## Detect

- In your code: `createRef<FormRef>()`, `useRef<FormRef>(null)` or a `RefObject<FormRef>` with no type argument.
- The type checker reports `'formData' is of type 'unknown'.` (TS18046) in the `onChange` or `onSubmit` handler of a form with a typed `formData`, or on the value `getFormData()` returns, because `Form` inferred `unknown` from the ref.

## Change

A bare `FormRef` defaults to `unknown`, and it can make `Form` infer `unknown` for `T` even when `formData` is typed. Supply the form-data type explicitly:

```diff
-const formRef = useRef<FormRef>(null);
+const formRef = useRef<FormRef<MyData>>(null);
```

The same goes for `createRef<FormRef<MyData>>()`.

If your ref is still typed as the `Form` class, or reads other members through it, see [A ref to Form holds a FormRef handle, not the class instance](./form-ref-is-a-formref-handle.md).

## Verify

- The form's handlers and `formRef.current?.getFormData()` are typed with `MyData`, and the type checker reports no `unknown` error on them.
- Nothing changes at runtime.
