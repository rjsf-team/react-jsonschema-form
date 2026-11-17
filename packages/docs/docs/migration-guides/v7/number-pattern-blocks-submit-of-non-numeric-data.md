---
title: 'A numeric field pattern can block a submit before RJSF validates it'
description: 'A non-numeric value in a `number`/`integer` field, such as legacy data like `"yo"`, now fails the input `pattern`, so the browser blocks the submit and `onSubmit`/`onError` never fire. Set `noHtml5Validate` to leave validation to RJSF.'
packages: ['@rjsf/core', '@rjsf/bootstrap3', '@rjsf/chakra-ui', '@rjsf/daisyui', '@rjsf/fluentui-rc', '@rjsf/mui', '@rjsf/react-bootstrap', '@rjsf/shadcn']
uses: [form]
schema: [numbers]
kind: runtime
noticed: review
related: [number-fields-render-text-input]
---

## Detect

- In your data: legacy or server values that aren't numbers loaded into a `number`/`integer` field.
- On the rendered page: submitting shows the browser's own "Please match the requested format" message on the field, and neither `onSubmit` nor `onError` runs.

## Change

The numeric field is now a text input with a `pattern` (see [Number and integer fields render a text input](./number-fields-render-text-input.md)), so native constraint validation blocks a submit whose value doesn't match, and the browser shows its message instead of an RJSF error. To make RJSF's validation the only validator, set `noHtml5Validate`:

```diff
-<Form schema={schema} validator={validator} />
+<Form schema={schema} validator={validator} noHtml5Validate />
```

## Verify

- Submitting the bad value calls `onError` and shows RJSF's type error on the field.
