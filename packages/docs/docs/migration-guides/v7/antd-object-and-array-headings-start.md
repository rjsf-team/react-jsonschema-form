---
title: antd starts the heading of an object or an array
description: "`@rjsf/antd`'s object and array headings used to end their column and now start it, beside the field labels. Set `formContext.labelAlign` to `'end'` to keep them at the end, and update tests or CSS that expect `text-align: end` on them."
packages: ['@rjsf/antd']
uses: [form, markup]
schema: []
affects: [appearance]
related: [antd-label-align-aligns-field-labels, antd-requires-antd-6-7]
---

## Detect

- On the rendered page: the title of an object or an array, drawn by `ObjectFieldTemplate` or `ArrayFieldTemplate`, sits at the start of its column instead of the end.
- In your tests or CSS: a check for `text-align: end` on a heading's column, or a selector for that column that doesn't expect the `ant-form-item-label-start` and `ant-form-item-label-left` classes.

## Change

The heading used to end by default, away from the fields it heads, whose labels sit above their controls at the start. It now starts its column, on the same side as those labels, and its column gains the `ant-form-item-label-start` and `ant-form-item-label-left` classes and loses antd's end alignment.

Some forms keep their headings at the end without a change. A form whose `formContext.labelCol` has a `span` and an `xl` that aren't 24, such as `{ span: 8 }` for a horizontal form, and that sets no `labelAlign` keeps them at the end, because antd ends the labels of a column that narrow and the headings follow them. On a screen up to `screenXSMax` wide (575px by default), antd starts every field label whatever `labelCol` says, so there such a form keeps its headings at the end beside labels at the start.

To keep a heading at the end in a form without such a `labelCol`, set `labelAlign` to `'end'`:

```diff
-<Form schema={schema} validator={validator} />
+<Form schema={schema} validator={validator} formContext={{ labelAlign: 'end' }} />
```

Under a `labelCol` of 24 columns this ends the headings but not the labels, which antd starts there, so it brings back the old mismatch between a heading and the labels of its fields. `labelAlign` now aligns field labels too, see [antd's labelAlign aligns field labels as well as headings](./antd-label-align-aligns-field-labels.md).

## Verify

- Headings sit on the side you expect, in tests and on the page.
- A test or stylesheet that expected the end alignment either sets the same `labelAlign` or expects the new classes.
