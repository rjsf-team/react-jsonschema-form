---
title: liveValidate and liveOmit no longer take a boolean
description: "The deprecated boolean values for the `liveValidate` and `liveOmit` Form props have been removed. Use `'onChange'` in place of `true`, and omit the prop or pass `undefined` in place of `false`."
packages: ['@rjsf/core']
uses: [form-props]
schema: []
kind: removal
noticed: type-error
related: []
---

## Detect

- Your `Form` passes `liveValidate` or `liveOmit` as a boolean, including the bare `liveValidate` shorthand; the type checker reports `error TS2322: Type 'true' is not assignable to type '"onBlur" | "onChange" | undefined'.`, or the same with `'false'`.

## Change

The `boolean` options for `FormProps.liveValidate` and `FormProps.liveOmit`, deprecated in a prior release, have been removed. Use `'onChange'` in place of `true`, or omit the prop (or pass `undefined`) in place of `false`:

```diff
-<Form liveValidate liveOmit={false} schema={schema} validator={validator} />
+<Form liveValidate='onChange' schema={schema} validator={validator} />
```

## Verify

- The form still validates on each change where you used `true`.
