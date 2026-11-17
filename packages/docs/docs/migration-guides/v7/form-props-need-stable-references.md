---
title: 'Form props that hold functions or components need stable references'
description: '`Form` now compares props shallowly, so a function, component or registry prop recreated on every render re-derives the form state each time, and a changed one takes effect at once. Memoize them or define them outside the render.'
packages: ['@rjsf/core']
uses: [form-props, custom-widgets, custom-fields, custom-templates]
schema: []
kind: runtime
noticed: review
related: [experimental-component-update-strategy-removed]
---

## Detect

- In your code: any of `customValidate`, `transformErrors`, `translateString`, `nameGenerator`, `customMergeAllOf`, `validator`, `fields`, `widgets`, `templates`, `formContext`, or a `uiSchema` carrying components such as `ui:widget`, created inside the render function of the component that renders `<Form>`.
- With `liveValidate: 'onChange'`: the current data is re-validated each time the parent re-renders with a recreated `validator`, `customValidate`, `transformErrors` or `customMergeAllOf`.

## Change

`Form` and `SchemaField` compare their props shallowly. A value recreated on every render re-derives the form's state on every render. Wrap it in `useCallback` or `useMemo`, or define it at module scope:

```diff
-const Editor = () => <Form schema={schema} validator={validator} transformErrors={(errors) => errors.filter(keep)} />;
+const transformErrors = (errors: RJSFValidationError[]) => errors.filter(keep);
+const Editor = () => <Form schema={schema} validator={validator} transformErrors={transformErrors} />;
```

A changed prop now takes effect at once, where v6 ignored it until another prop changed. With `liveValidate: 'onChange'`, a changed `validator`, `customValidate`, `transformErrors`, `customMergeAllOf` or `schema` also re-validates the current data. That re-validation, and the one `setFieldValue('', data)` triggers, validates with the schema resolved for the data whenever the schema utilities are unchanged (the same `schema`, `validator`, `defaultFormStateBehavior` and `customMergeAllOf`), the way an edit is validated. A replaced value shows the same live errors typing it would, and a miss that only the root schema reports (`if`/`then`, `oneOf`) shows on submit, as it does for typed data.

`uiSchema` and `formContext` take effect in rendering at once, but a change to either re-validates only on the next data change, blur or submit. That matters if `ui:required` depends on state outside the form.

## Verify

- Re-rendering the parent with unchanged inputs doesn't re-derive the form's state or re-run live validation.
- Changing one of these props updates the form on that render.
- A `ui:required` that depends on outside state is re-checked once the user edits, blurs or submits.
