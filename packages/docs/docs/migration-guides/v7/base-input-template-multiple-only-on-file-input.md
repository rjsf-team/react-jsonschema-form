---
title: BaseInputTemplate puts multiple only on a file input
description: "Every theme's `BaseInputTemplate` now puts `multiple` on a `file` input only, so an `email` input no longer takes several addresses. Render the `<input>` yourself in a widget that needs `multiple`."
packages: ['@rjsf/core', '@rjsf/bootstrap3', '@rjsf/daisyui', '@rjsf/react-bootstrap', '@rjsf/shadcn']
uses: [custom-widgets]
schema: []
kind: runtime
noticed: review
related: []
---

## Detect

- Your custom widget renders the registry's `BaseInputTemplate` with `multiple`, such as an `email` input that takes a comma-separated list of addresses.
- On the rendered page, that input rejects a comma-separated list, and the `<input>` has no `multiple` attribute.

## Change

`ArrayField` passes `multiple` to the widget of every multi-select, whatever widget `ui:widget` names, and a `BaseInputTemplate` can't tell that `multiple` from one a widget passes on purpose. So every theme's `BaseInputTemplate` now puts `multiple` on a `file` input only. Before, `core` and `daisyui` put it on any input, and `react-bootstrap` and `shadcn` put a `multiple` in `extraProps` on any input.

A widget that wants an `email` input to take several addresses renders the `<input>` itself. It then carries what the template did for it: the `name`, the `disabled`, `readonly` and `required` state, `ui:emptyValue` for a cleared input, the `onBlur` and `onFocus` that drive blur validation, and the ARIA attributes of `getControlAttributes()`:

```diff
-return <BaseInputTemplate {...props} type='email' multiple />;
+const { id, htmlName, value, disabled, readonly, required, autofocus, options, onChange, onBlur, onFocus } = props;
+return (
+  <input
+    id={id}
+    name={htmlName || id}
+    type='email'
+    multiple
+    value={toInputValue(value)}
+    disabled={disabled}
+    readOnly={readonly}
+    required={required}
+    autoFocus={autofocus}
+    onChange={(e) => onChange(e.target.value === '' ? options.emptyValue : e.target.value)}
+    onBlur={(e) => onBlur(id, e.target.value)}
+    onFocus={(e) => onFocus(id, e.target.value)}
+    {...getControlAttributes(props)}
+  />
+);
```

This leaves out the theme's styling, the examples list and the clear button. A widget that needs them renders them too.

## Verify

- The input accepts a comma-separated list of addresses.
- Clearing the input stores `ui:emptyValue`, and leaving it runs blur validation.
- The input keeps its `name`, its disabled, read-only and required state, and its ARIA attributes.
