---
title: Mantine ignores ui:options that would replace what the form passes
description: "`@rjsf/mantine` passed every `ui:options` key to its components, so `onChange`, `value`, `name` and nine others could override the form's own. Those twelve are now dropped; use the form prop, schema keyword or `ui:` key that controls each."
packages: ['@rjsf/mantine']
uses: [ui-schema]
schema: []
kind: removal
noticed: review
related: [shadcn-range-ignores-form-controlled-props, mui-ignores-form-controlled-props-in-ui-options-mui]
---

## Detect

In your `uiSchema`, a `@rjsf/mantine` field whose `ui:options` sets `id`, `name`, `value`, `defaultValue`, `readOnly`, `autoFocus`, `data`, `multiple`, `error`, `onChange`, `onBlur` or `onFocus`.

## Change

Options reach Mantine's components as props, so these could replace what the form passes. An `onChange` stopped the form seeing any edits, a `name` changed what the field submits under, a `defaultValue` showed an empty field with a value the form didn't have, and a `readOnly` locked a field the form treated as editable. A `data` replaced a select's options, so picking one lost the value, and an `error: false` stopped marking an invalid field as invalid.

They're now dropped as invalid options. Other options that Mantine's components take as props still apply.

- For `value` and `defaultValue`, set the form's data or the schema's `default`.
- For `id`, use the `Form`'s `idPrefix`.
- For `name`, use the `Form`'s `nameGenerator`.
- For `readOnly`, use `ui:readonly`, which renders the field disabled instead of read-only.
- For `autoFocus`, use `ui:autofocus`.
- For `data`, set the options in the schema, with `enum` or `oneOf`.
- For `multiple`, make the field's schema an array of files.
- For `error`, add the message with the `Form`'s `extraErrors` or `customValidate`, and hide messages with `ui:hideError`.
- For `onChange`, `onBlur` and `onFocus`, use the `Form`'s props of the same name.

```diff
 const uiSchema = {
   name: {
-    'ui:options': { autoFocus: true, onChange: logChange },
+    'ui:autofocus': true,
   },
 };
+
+<Form schema={schema} uiSchema={uiSchema} validator={validator} onChange={logChange} />;
```

## Verify

Each field you moved off these options keeps the behaviour you set, and the form's data follows every edit.
