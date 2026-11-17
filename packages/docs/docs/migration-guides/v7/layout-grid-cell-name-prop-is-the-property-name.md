---
title: 'Fields, widgets and templates in a layout grid cell get the property name as name'
description: 'In a layout grid cell, the `name` of the field and widget and the `keyName` of `WrapIfAdditionalTemplate` used to be the dotted path; they are now the property name. Read `fieldPath` in a field or `FieldTemplate` for the full path.'
packages: ['@rjsf/core']
uses: [custom-fields, custom-widgets, custom-templates]
schema: []
kind: runtime
noticed: review
related: [layout-grid-cell-labelled-by-property-name]
---

## Detect

- In a custom field (including one a cell names by `ui:field`), widget, `FieldTemplate` or `WrapIfAdditionalTemplate` rendered in a layout grid cell: code that reads a dotted path such as `person.address.city` from `name` or `keyName`.

## Change

The cell's name is the `name` prop of its field and of its widget, and the `keyName` of its `WrapIfAdditionalTemplate`, so all of them now get the property name, `city`. A field or `FieldTemplate` reads the full path from `fieldPath`, which is unchanged:

```diff
-const path = props.name;
+const path = props.fieldPath;
```

A widget or `WrapIfAdditionalTemplate` is handed no `fieldPath`. One that needs the path takes it from the custom field or `FieldTemplate` that renders it. A cell with a `render` component still hands it the dotted path as `name`.

## Verify

- Your components inside a grid find the full path, and code that wants the property name reads `name`.
