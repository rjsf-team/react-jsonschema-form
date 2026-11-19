---
title: The private internalFormWrapper prop of Form is removed
description: The private `_internalFormWrapper` prop of `Form` and its `ThemeProps` entry are removed. Use the public `tagName` prop to render another element in place of the form element.
packages: ['@rjsf/core']
uses: [custom-theme, form-props]
schema: []
affects: [code]
related: []
---

## Detect

- `_internalFormWrapper` passed to `Form`, or set in the `ThemeProps` you pass to `withTheme()`, in your code.
- Type checker: `Object literal may only specify known properties, and '_internalFormWrapper' does not exist in type 'ThemeProps<…>'.` (TS2353) in `withTheme()`, or `Type '{ …; _internalFormWrapper: …; }' is not assignable to type 'IntrinsicAttributes & FormProps<…>'.` (TS2322) on `Form`.

## Change

The prop existed so `@rjsf/semantic-ui` could wrap the `<form>` element in its own `Form` component, and no other theme used it. Remove it from the theme and pass `tagName` to the rendered form instead. `ThemeProps` has no `tagName` entry, so set it where you render the form:

```diff
 const MyForm = withTheme({
-  _internalFormWrapper: MyFormWrapper,
   widgets,
 });

-<MyForm schema={schema} validator={validator} />
+<MyForm schema={schema} validator={validator} tagName={MyFormWrapper} />
```

## Verify

- The type checker no longer reports `_internalFormWrapper`.
- The rendered page shows your element in place of `<form>`, and submitting still calls `onSubmit`.
