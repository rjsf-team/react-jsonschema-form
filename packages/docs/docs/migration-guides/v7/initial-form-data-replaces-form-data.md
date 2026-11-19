---
title: The formData prop is deprecated in favor of initialFormData
description: '`Form` is now uncontrolled: `initialFormData` is the seed it reads on mount and on `reset()`, and `formData` is a deprecated name for it. Rename `formData` to `initialFormData`.'
packages: ['@rjsf/core']
uses: [form]
schema: []
kind: deprecation
noticed: review
related: [form-data-changes-after-mount-are-ignored, refuse-or-rewrite-edits-in-transform-change, defaults-are-filled-in-without-onchange, reset-goes-back-to-the-seed]
---

## Detect

- A `formData=` prop on `Form` or a themed form in your code.
- Your editor or linter flags `formData` through its `@deprecated` tag.
- In development, the console shows a warning ending in `[form-data-both-seeds]` for a form passed both `formData` and `initialFormData`.

## Change

`Form` works like an uncontrolled `<input defaultValue={text}>`. It reads the seed once and then keeps its own value:

- `initialFormData` is the seed. The form reads it when it mounts and when `reset()` is called, and fills it in with the schema's defaults. On every other render the form ignores it.
- After mount, the data belongs to the form. Each edit is applied, validated and shown before `onChange` reports it, whatever your handler does with the event.
- `getFormData()` on the form's ref reads the current value at any time.
- `formData` is a deprecated name for the seed. It still works, and when you pass both props, `formData` is the seed. In development, passing both logs the `form-data-both-seeds` warning, which [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make throw.

Rename the prop:

```diff
-<Form schema={schema} validator={validator} formData={data} onChange={(e) => setData(e.formData)} />
+<Form schema={schema} validator={validator} initialFormData={data} onChange={(e) => setData(e.formData)} />
```

Only `undefined` means "not passed". `null` seeds the schema's defaults, as `undefined` does. `false`, `0` and `''` are values.

Two common patterns need nothing beyond the rename:

- Storing every edit, as in `formData={data} onChange={(e) => setData(e.formData)}`. The value you pass back is the form's own, so passing it changes nothing, even if you store it late (after an `await`, say).
- Writing `formData` inline, such as `formData={{}}`, without storing what `onChange` reports. A re-render no longer throws the user's edits away.

Other patterns have their own entries: a `formData` that changes after mount ([A formData that changes after mount no longer replaces the data](./form-data-changes-after-mount-are-ignored.md)), an `onChange` that refuses or rewrites edits or computes a field ([Refusing or rewriting an edit moves from onChange to transformChange](./refuse-or-rewrite-edits-in-transform-change.md)), an `onChange` expected on mount ([Form no longer calls onChange on mount for defaults or null fields](./defaults-are-filled-in-without-onchange.md)) and calls to `reset()` ([reset() goes back to the seed](./reset-goes-back-to-the-seed.md)).

## Verify

- No `formData=` prop remains on your forms, and the editor shows no deprecation for it.
- The form shows the same data on mount as before.
