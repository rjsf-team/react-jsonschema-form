---
title: 'An untitled nested layout grid cell is labelled by its property name'
description: 'A layout grid cell naming a nested field such as `person.address.city` used to be labelled with that dotted path when untitled; it is now labelled `city`. Give the cell a `ui:title` to keep or tell apart labels.'
packages: ['@rjsf/core']
uses: [ui-schema, markup]
schema: []
affects: [experience]
related: [layout-grid-cell-name-prop-is-the-property-name, layout-grid-discriminated-cell-renders-a-field-wrapper]
---

## Detect

- In your `ui:layoutGrid`: a cell naming a nested field, such as `person.address.city`, or an array item, such as `person.list.0`, whose schema has no title.
- On the rendered page or in tests: that cell's label reads `city` or `list-0` where it read the dotted path.
- On the rendered page: two untitled cells with the same property name, such as `person.name` and `company.name`, are both labelled `name`.

## Change

The grid now hands the cell's `SchemaField` the property name, so the cell is labelled as the same field is outside a grid. A cell that names an array item is named as `ArrayField` names it, `list-0`. Ids, `htmlName`, form data and errors come from the full path and don't change.

A grid shows cells side by side without the headings of the objects that hold them, so give a cell a `ui:title` to keep the old label or to tell two cells apart:

```diff
 {
   "ui:field": "LayoutGridField",
   "ui:layoutGrid": { "ui:row": [{ "ui:col": ["person.address.city"] }] },
+  "person": { "address": { "city": { "ui:title": "person.address.city" } } }
 }
```

## Verify

- Each cell shows the label you mean, and your tests find it by that label.
