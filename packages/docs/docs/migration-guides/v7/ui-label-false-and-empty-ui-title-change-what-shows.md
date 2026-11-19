---
title: ui:label false hides the description in every theme, and an empty ui:title no longer hides a heading
description: 'Under `@rjsf/antd`, `ui:label: false` now hides the description with the label, and an empty `ui:title` or `ui:description` on an object no longer hides the schema''s. Set `ui:label: false` to hide both, or draw the part you keep yourself.'
packages: ['@rjsf/core', '@rjsf/antd']
uses: [ui-schema]
schema: []
affects: [appearance]
related: []
---

## Detect

- `"ui:label": false` in your `uiSchema` under `@rjsf/antd`, on a field with a schema `description` or a `ui:description`.
- `"ui:title": ""` or `"ui:description": ""` on an object field in your `uiSchema`.
- On the rendered page or in a snapshot, an antd field's description is gone, or an object's schema `title` or `description` shows again.

## Change

`ui:label: false` hides the description along with the label in every theme, as it already did outside `@rjsf/antd`.

An empty `ui:title` or `ui:description` on an object no longer hides its heading or description: the schema's `title` or `description` shows instead, as it already did for an array and for a field whose template draws its label. Set `ui:label: false` to hide both:

```diff
- "ui:title": "",
- "ui:description": "",
+ "ui:label": false,
```

## Verify

- A field with `ui:label: false` shows neither label nor description, under `@rjsf/antd` too.
- The object renders with no heading and no description.

## If you can't preserve it

`ui:label: false` hides the label or heading and the description together. To keep one of them, draw it yourself, such as in a custom `FieldTemplate` or widget for an antd field, or a custom `ObjectFieldTemplate` for an object.
