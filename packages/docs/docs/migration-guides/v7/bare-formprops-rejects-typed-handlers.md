---
title: A typed handler no longer fits a bare FormProps
description: A bare `FormProps` now means `FormProps<unknown>`, so handlers or validators typed for your data no longer fit it. Type the props object or wrapper component as `FormProps<MyData>`.
packages: ['@rjsf/core']
uses: [typescript]
schema: []
affects: [code]
related: [form-data-type-defaults-to-unknown]
---

## Detect

- In your code: a props object or a wrapper component typed as bare `FormProps` that takes typed handlers, such as `customValidate: (formData: MyData | undefined, …)` or `onSubmit: (e: IChangeEvent<MyData>) => …`.
- The type checker reports `Type '…' is not assignable to type '…'.` (TS2322) on that handler.

## Change

Values annotated without a type argument still fit a typed form, but the reverse does not hold: `FormProps` means `FormProps<unknown>`, and a handler typed for `MyData` doesn't fit it. Give `FormProps` your data type:

```diff
-function MyForm(props: FormProps) {
+function MyForm(props: FormProps<MyData>) {
   return <Form {...props} />;
 }
```

## Verify

- The type checker accepts the typed handlers on the props object or wrapper.
- Nothing changes at runtime.
