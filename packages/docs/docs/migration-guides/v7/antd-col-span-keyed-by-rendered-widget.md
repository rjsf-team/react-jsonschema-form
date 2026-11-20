---
title: antd's colSpan looks a property up by the widget it renders
description: 'A `formContext.colSpan` record used to key a property by widget only for a `ui:widget`, and now looks up the widget every property renders first, so `text`, `checkbox` or `select` entries span more properties. Check each widget entry.'
packages: ['@rjsf/antd']
uses: [form-props]
schema: []
affects: [appearance]
related: [antd-custom-object-properties-set-rendered-as]
---

## Detect

- Your `@rjsf/antd` form passes `formContext.colSpan` with widget entries such as `text`, `email`, `checkbox`, `select` or `files`.
- On the rendered page: columns that used to take the `string` or `boolean` span now take a widget entry's span.

## Change

A `colSpan` record is now looked up by the widget each property renders, even one with no `ui:widget`, then by the field a `ui:field` or its `$id` names, then by its type ([#5516](https://github.com/rjsf-team/react-jsonschema-form/issues/5516)). Before, only a `ui:widget` keyed a property by widget, so a plain string fell through to `string` and a boolean to `boolean`.

- A plain string, number or integer matches a `text` entry, a boolean a `checkbox` entry, an `enum`, a boolean with labelled options or a multiple-choice array a `select` entry, and an array of files a `files` entry, ahead of their type.
- A string whose `format` names a widget, such as `date`, `email`, `data-url` or `hostname`, matches the entry of that format's name, not `text` or `file`, even where it renders the same widget as one of those.
- A property whose `anyOf`/`oneOf` option renders its control matches the entry of the widget that option renders, such as `textarea` for a `ui:widget: 'textarea'` the options inherit, or `email` for an option with that `format`.
- One with no type of its own, such as an untyped `anyOf`, matches the entry of the option's type too, such as `object` for an object option, which also spans it full width by default, and of a field the option's `ui:field` names.

Check each widget entry in the record, and change or remove it where it now spans properties you didn't mean:

```diff
 formContext = {
-  colSpan: { text: 12, string: 8 },
+  colSpan: { string: 8 },
 };
```

## Verify

- Each property spans the columns you intend.
