---
title: extraErrors block submission by default
description: '`extraErrorsBlockSubmit` is replaced by `extraErrorsAreWarnings`, and `extraErrors` now block submit by default like validation errors. Set `extraErrorsAreWarnings` for the old non-blocking behaviour, and drop `extraErrorsBlockSubmit`.'
packages: ['@rjsf/core']
uses: [form-props]
schema: []
kind: removal
noticed: review
related: []
---

## Detect

- In your code: `extraErrorsBlockSubmit` on a `Form`. The type checker reports `TS2322` with `Property 'extraErrorsBlockSubmit' does not exist on type 'IntrinsicAttributes & FormProps<…>'`.
- In your code: `extraErrors` on a `Form` without `extraErrorsBlockSubmit`, which used to show the errors without blocking submit.
- In your code: `extraErrors` set from a failed server response and left in place afterward.

## Change

`FormProps.extraErrorsBlockSubmit` has been replaced with `FormProps.extraErrorsAreWarnings`, and the default is inverted: `extraErrors` now block form submission by default, the same as JSON Schema validation errors.

If you relied on the old default, where `extraErrors` showed but didn't block, set `extraErrorsAreWarnings`:

```diff
-<Form schema={schema} validator={validator} extraErrors={extraErrors} />
+<Form schema={schema} validator={validator} extraErrors={extraErrors} extraErrorsAreWarnings />
```

If you set `extraErrorsBlockSubmit` to get blocking behaviour, remove it, since that is now the default:

```diff
-<Form schema={schema} validator={validator} extraErrors={extraErrors} extraErrorsBlockSubmit />
+<Form schema={schema} validator={validator} extraErrors={extraErrors} />
```

Every submit re-merges whatever `extraErrors` currently holds. If you set it from a failed server response and leave it populated, resubmitting re-blocks on those stale errors and calls `onError` again. Clear `extraErrors` (back to `{}`, for example) when the user edits the form or before they resubmit, as you would a schema validation error.

## Verify

- With `extraErrorsAreWarnings`, the form submits while showing `extraErrors`.
- Without it, `extraErrors` block submit and `onError` receives them.
- After a server error, editing the form and resubmitting reaches `onSubmit` once the server accepts the data.
