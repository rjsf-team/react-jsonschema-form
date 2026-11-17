---
title: shadcn's RangeWidget ignores name, disabled, value and defaultValue in ui:options.props
description: "`ui:options.props` could override a shadcn range's `name`, `disabled`, `value` and `defaultValue`, pinning its thumbs or unlocking a disabled form. The four keys are now dropped; use form data or `default`, `nameGenerator` and `ui:disabled`."
packages: ['@rjsf/shadcn']
uses: [ui-schema]
schema: [numbers]
kind: removal
noticed: review
related: [mantine-ignores-form-controlled-ui-options, mui-ignores-form-controlled-props-in-ui-options-mui]
---

## Detect

In your `uiSchema`, a `@rjsf/shadcn` range field with `name`, `disabled`, `value` or `defaultValue` in `ui:options.props`.

## Change

The `value` replaced the form's value on the slider, so its thumbs stayed where it put them, and only the first thumb's value could reach the form. A `name` changed what the range submits under, and `disabled: false` let a user edit a range on a disabled or read-only form.

`RangeWidget` now drops all four keys, so the form's data always sets the slider, and it draws one thumb. Other `ui:options.props` keys, such as `min`, `orientation` and `onValueChange`, still apply.

Set the starting value through the form's data, or the schema's `default`, instead:

```diff
 const uiSchema = {
   volume: {
     'ui:widget': 'range',
-    'ui:options': { props: { value: [2] } },
   },
 };
+const formData = { volume: 2 };
```

For `name`, use the `Form`'s `nameGenerator`. For `disabled`, use `ui:disabled`.

## Verify

The range starts at the value in your form data, moves when dragged, and is locked when the form or field is disabled or read-only.
