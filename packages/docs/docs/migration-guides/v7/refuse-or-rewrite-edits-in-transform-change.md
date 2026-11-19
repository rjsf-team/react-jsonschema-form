---
title: Refusing or rewriting an edit moves from onChange to transformChange
description: 'The form now applies an edit before `onChange` reports it, so not storing or rewriting the event no longer refuses or changes it. Move that logic into `transformChange(next, previous)`.'
packages: ['@rjsf/core']
uses: [form-props]
schema: []
affects: [code, data]
related: [initial-form-data-replaces-form-data, transform-change-keeps-cleared-keys]
---

## Detect

- An `onChange` in your code that returns early without storing the event, to refuse an edit.
- An `onChange` that stores a rewritten copy of `formData`, such as a trimmed or upper-cased string.
- An `onChange` that computes a field from other fields and passes the result back as `formData`.

## Change

By the time `onChange` runs, the form has already applied the edit. `onChange` reports an edit and no longer decides it. That decision goes in [`transformChange`](../../api-reference/form-props.md#transformchange), a pure function that receives the data the edit produced (`next`) and the data before it (`previous`), and returns the data the form should keep. The form calls it for every edit, from a field or from `setFieldValue()`, and for those alone, before it stores, validates and reports the result. What the form derives on its own (its defaults, the live omit a blur runs and a `reset()`) is stored without it, and only the last two are reported through `onChange`.

```diff
-const onChange = ({ formData }) => {
-  if ((formData.title ?? '').length > 80) return;
-  setData({ ...formData, code: formData.code?.toUpperCase() });
-};
+const transformChange = (next, previous) => {
+  if ((next?.title ?? '').length > 80) return previous;
+  return next?.code === undefined ? next : { ...next, code: next.code.toUpperCase() };
+};
+const onChange = ({ formData }) => setData(formData);
```

Return `next` to take the edit, `previous` to refuse it, or another value. Keep these rules in mind:

- It runs for every keystroke, so a rewrite has to hold for a value the user is still typing and for a field they cleared, which is `undefined`. Upper-casing holds. Trimming would remove a space as soon as it is typed.
- Return `next`'s unchanged subtrees as they are, so their fields don't render again.
- Keep the function pure. The form may call it more than once for the same edit, the way React may [call a component more than once](https://react.dev/reference/rules/components-and-hooks-must-be-pure).
- A decision that has to wait, such as a server check, can still undo an edit afterwards with `setFieldValue()`.

For a field computed from other fields, [compute it in `transformChange`](../../api-reference/form-props.md#compute-a-field-from-other-fields), and into `initialFormData` too, since the seed doesn't go through `transformChange`.

A `transformChange` that drops keys holding `undefined` loses the user's clears, see [A transformChange that drops a cleared key loses the clear](./transform-change-keeps-cleared-keys.md).

## Verify

- A refused edit no longer shows in the form, and a rewritten value shows as rewritten while the user types.
- When an edit switches a `oneOf`/`anyOf` option, the selector stays on the option the user picked unless you refuse the switch or rewrite that field's data. A rewrite elsewhere in the form keeps the choice. A rewrite at the field keeps it only while the rewritten data still fits the picked option, and otherwise moves the selector to the option that data fits.
