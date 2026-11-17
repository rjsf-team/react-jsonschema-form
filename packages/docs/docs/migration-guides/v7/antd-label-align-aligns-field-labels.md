---
title: antd's labelAlign aligns field labels as well as headings
description: "`@rjsf/antd`'s `formContext.labelAlign` used to move only object and array headings and now also aligns every field label in a horizontal form. Check your labels, and use `'start'` or `'end'` instead of the deprecated `'left'` or `'right'`."
packages: ['@rjsf/antd']
uses: [form-props]
schema: []
kind: runtime
noticed: review
related: [antd-object-and-array-headings-start, antd-requires-antd-6-7]
---

## Detect

- In your code: a `formContext` with `labelAlign`, or a `@rjsf/antd` form inside an antd `Form` that sets `labelAlign`, `labelCol` or `layout`.
- On the rendered page: field labels in a horizontal form move to the start.
- In the console: antd 6 logs a development warning for a `labelAlign` of `'left'` or `'right'`.

## Change

The theme now passes `labelAlign` to the `Form.Item` of every field and of an additional property's key, so `'start'` and `'left'` start the labels and `'end'` and `'right'` end them. It doesn't align the text of a `CheckboxWidget`, which the widget draws beside its box.

In a standard horizontal form, where `labelCol` is narrower than 24 columns such as `{ span: 8 }`, a `labelAlign` of `'start'` or `'left'` now starts the labels, which antd ends by default. `'end'` and `'right'` change nothing there. antd starts the label of a 24-column `labelCol` whatever `labelAlign` says, so under the default `labelCol` `labelAlign` still moves only the headings. Drop `labelAlign` if you set it only to move headings in a horizontal form, or accept the moved labels.

antd 6 deprecates `'left'` and `'right'` for `'start'` and `'end'`, which need antd 6.7 or newer (see [antd 6.7 is required](./antd-requires-antd-6-7.md)):

```diff
-formContext={{ labelAlign: 'left' }}
+formContext={{ labelAlign: 'start' }}
```

The theme reads `labelAlign` and `labelCol` from `formContext` for a heading, which can't see the `labelAlign`, `labelCol` or `layout` of an enclosing antd `Form`. A field's label gets the `labelAlign` and `layout` of an enclosing `Form` through antd's context, but not its `labelCol`, which the theme replaces with `formContext.labelCol` (`{ span: 24 }` by default). Set `labelCol` in `formContext` to size the labels.

## Verify

- Field labels and headings sit where you expect in a horizontal form.
- The console shows no antd warning about `'left'` or `'right'`.
