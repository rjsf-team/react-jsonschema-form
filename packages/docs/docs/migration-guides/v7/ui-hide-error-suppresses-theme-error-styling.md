---
title: 'ui:hideError now removes the theme error styling and reaches nested fields'
description: 'Under `ui:hideError` the themes used to keep their red outline or invalid state, and mantine still showed the error text. Every theme now drops both, and the directive reaches child fields; check forms that hide errors.'
packages: ['@rjsf/core']
uses: [ui-schema]
schema: []
kind: runtime
noticed: review
related: [custom-widget-error-state-from-has-widget-errors, chakra-ui-checkboxes-invalid-only-with-visible-errors, mantine-field-error-template-shows-unshown-errors]
---

## Detect

- In your `uiSchema`: `ui:hideError`, at the root or on a field.
- On the rendered page: a field with hidden errors loses its red outline or invalid state, such as MUI's `Mui-error`, Bootstrap's `is-invalid`, Chakra's `invalid` flag, Fluent's `validationState` or shadcn's `border-destructive`.
- In `@rjsf/mantine`: the error text under such a field is gone.

## Change

`ui:hideError` used to suppress only the messages RJSF renders, so a field with hidden errors kept a red outline with nothing explaining it ([#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684)). `@rjsf/mantine` handed the messages to Mantine's own `error` prop, and its `AltDateWidget` and `RangeWidget` rendered an `Input.Error` each, so the text itself showed. Every theme's widgets now respect the directive. A form using `ui:hideError` loses that outline, and on Mantine the error text with it.

A field's `ui:hideError` is resolved as its own, then the one its parent resolved to, so a parent's directive reaches its children. `ui:globalOptions` holds no `hideError`, so a `ui:hideError` at the root of the `uiSchema` hides every field's errors. The directive also reaches components that were never handed it: the `oneOf`/`anyOf` selector `MultiSchemaField` renders, the widget `ArrayField` renders for a multi-select array or an array of files, and the `ArrayFieldTemplate` and `ObjectFieldTemplate`, whose `hideError` prop was declared but never set.

`rawErrors` still holds the full list while errors are hidden, so a custom widget can render them its own way. The form-level error list is unaffected; [`showErrorList`](../../api-reference/form-props.md#showerrorlist) controls it.

To keep a child's errors styled under a parent that hides them, set `ui:hideError: false` on the child:

```diff
 const uiSchema = {
   'ui:hideError': true,
+  email: { 'ui:hideError': false },
 };
```

## Verify

- Fields under `ui:hideError` show neither messages nor invalid styling, and fields that opt back out show both.
- The error list still follows `showErrorList`.
