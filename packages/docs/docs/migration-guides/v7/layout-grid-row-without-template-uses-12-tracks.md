---
title: A layout grid row without a column template lays out on 12 tracks
description: "In chakra-ui, fluentui-rc and shadcn, a `ui:row` with no column template used to let the grid place its children and now lays out on 12 tracks, stacking auto-placed children. Give such a row its own template to keep the old layout."
packages: ['@rjsf/chakra-ui', '@rjsf/fluentui-rc', '@rjsf/shadcn']
uses: [ui-schema]
schema: []
kind: runtime
noticed: review
related: [antd-grid-span-counts-twelfths]
---

## Detect

- In your uiSchema: a `ui:row` under `ui:layoutGrid` that has no column template of its own (`templateColumns`, `templateAreas`, `columns`, a `gridTemplateColumns`, `gridTemplateAreas`, `gridTemplate` or `grid` style, the same keys in chakra-ui's `css`, or a `grid-cols-*` class) and relies on the grid placing its children, such as a chakra-ui row with `autoFlow: 'column'`, a fluentui-rc row with `rows` but no `columns`, or a shadcn row with `grid-flow-col`.
- On the rendered page: children that used to sit side by side are stacked.

## Change

So that a column's `span` lays out the same in every theme, such a row now lays out on 12 tracks, and each child is full width unless it spans fewer. Give the row its template to keep the old layout:

```diff
 'ui:row': {
+  templateColumns: 'repeat(3, 1fr)',
   autoFlow: 'column',
   children: ['first', 'middle', 'last'],
 },
```

## Verify

- The row's children sit side by side as before.
- A row whose children set a `span` gives each child that many twelfths of the row.
