---
title: 'The errorSchema a field passes to onChange is taken as its own errors'
description: 'The `errorSchema` passed to `onChange` used to be compared against validator and `extraErrors` messages; it is now taken whole as the field''s own raise. Pass only the errors the field computes, never its `errorSchema` prop.'
packages: ['@rjsf/core']
uses: [custom-fields, custom-widgets, custom-templates]
schema: []
affects: [code, experience]
related: [field-raised-errors-kept-apart-from-validator-errors, array-field-no-longer-passes-error-schema-on-item-moves]
---

## Detect

- In your field, widget or template: its `errorSchema` prop, or a copy of it, passed as the third argument of `onChange`.
- On the rendered page: validator errors or `extraErrors` stay shown after the validator stops reporting them or the parent clears `extraErrors`.

## Change

The form used to accept the `errorSchema` prop handed back, with the validator's errors and `extraErrors` in it, and worked out by comparing messages which entries were the field's own. An own error that read the same as an `extraErrors` message at the same path was taken for the parent's, and disappeared when the parent cleared `extraErrors`. Now a field that passes its `errorSchema` prop back claims every error in it, and they stay on display until the field raises again. A field that raises the messages it computes needs no change. Pass only what the field raises:

```diff
-onChange(newValue, fieldPath, errorSchema);
-onChange(newValue, fieldPath, { ...errorSchema, __errors: [...(errorSchema?.__errors ?? []), 'Bad value'] });
+onChange(newValue, fieldPath);
+onChange(newValue, fieldPath, { __errors: ['Bad value'] });
```

A raise takes the validator's errors at and below its path off the display until the form validates again, so raise at the narrowest path the error belongs to. A raise at an object's path removes the validator's errors of the properties below it. It also replaces the errors the fields below it raised themselves, since a raise is everything the field has to say about its path, so a raise at the root replaces those of every field in the form.

Some built-in controls change errors without an `errorSchema`:

- The optional data controls no longer pass the field's `errorSchema` back. Adding data passes none. Removing it passes an empty one, which clears the errors at and below the removed value, the validator's and the fields' own. Removing an additional property clears the errors at and below its key the same way.
- Renaming an additional property moves the errors under its key to the new name, where they stayed under the old one.
- Switching the option of a `oneOf` or `anyOf` drops the errors the fields raised under every key the old option declared or the data held, and at the field's own path. The validator's errors go only under keys the new option doesn't declare. Under a key it declares too they stay until the form validates again, as does one on the switched field itself. A property the schema declares beside its options keeps its errors.

## Verify

- Clearing `extraErrors` removes those errors, and validator errors go once the value is valid.
- Your field's own errors show and clear as the field raises them.
