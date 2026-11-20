---
title: 'A custom field that renders FieldTemplate itself passes hasErrors'
description: 'The built-in templates now take their error state only from a required `hasErrors` prop, with no fallback to `rawErrors`. Pass `hasErrors` from a custom field that renders `FieldTemplate` itself.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-fields]
schema: []
affects: [code, appearance]
related: [custom-templates-take-error-state-from-has-errors, layout-grid-discriminated-cell-renders-a-field-wrapper]
---

## Detect

- In your custom field: a theme `FieldTemplate` rendered directly, outside `SchemaField`.
- In the type checker: `Property 'hasErrors' is missing in type '{ schema: JSONSchema7; … }' but required in type '{ fieldPath: FieldPath; id: string; … }'.`, under a `TS2769` "No overload matches this call." on the `FieldTemplate` element.
- On the rendered page: such a field shows its messages with no red outline or invalid status, or, in `@rjsf/antd`, has its messages without the form item's error status.
- In your `ui:field` component: an inner `SchemaField` handed `ui:hideError: false` while the outer field hides errors.

## Change

Pass `hasErrors` alongside the `errors` you hand the template. The built-in templates take their error state only from it, so a field passing `rawErrors` with `hasErrors={false}` keeps its messages but has no invalid styling. In `@rjsf/antd`, `hasErrors` also decides whether the messages are shown; a field passing just `rawErrors` still has them shown through v7, without the error status. v7 doesn't fall back to `rawErrors` as 6.x templates did. From plain JavaScript, a template rendered without `hasErrors` has no error state in any theme, and neither does the `WrapIfAdditionalTemplate` it hands its props to.

```diff
+const hasErrors = !hideError && (errorSchema?.[ERRORS_KEY]?.length ?? 0) > 0;
 <FieldTemplate
   {...templateProps}
   rawErrors={hideError ? undefined : errorSchema?.[ERRORS_KEY]}
+  hasErrors={hasErrors}
+  errorSchema={errorSchema}
 />
```

Pass `rawErrors` on the same terms `SchemaField` does, the full list while errors are shown and `undefined` while hidden, and pass `errorSchema` through unchanged.

A `ui:field` component that renders `SchemaField` for its own data and hands it `ui:hideError: false`, while its own hides the errors, now has those errors drawn by the inner field, styled in error with its control marked `aria-invalid`. In 6.x the inner field drew nothing, since only the outer field had them. To keep them hidden throughout, leave `ui:hideError` alone in the `uiSchema` you hand on, or set it to `true`.

## Verify

- Your field compiles, and shows its messages with the theme's invalid styling while it has errors to show.
- An inner `SchemaField` shows errors only where you meant it to.
