---
title: A template that reorders items needs ui:orderable left on
description: '`ui:orderable: false` used to hide only core''s arrows, and now also makes `onMoveUpItem` and `onMoveDownItem` do nothing. A drag-and-drop template leaves `ui:orderable` on and drops the arrows from its own `ArrayFieldItemButtonsTemplate`.'
packages: ['@rjsf/core']
uses: [custom-templates, ui-schema]
schema: [arrays]
kind: runtime
noticed: review
related: [array-templates-disable-buttons-that-cannot-act]
---

## Detect

- Your uiSchema sets `ui:orderable: false` on an array whose template reorders items by calling `onMoveUpItem` or `onMoveDownItem`, as a drag-and-drop template does.
- On the rendered page: dragging an item no longer moves it.

## Change

Leave `ui:orderable` on and leave the arrows out of your own `ArrayFieldItemButtonsTemplate` instead:

```diff
- uiSchema = { 'ui:orderable': false };
+ templates = { ArrayFieldItemButtonsTemplate: MyButtonsWithoutArrows };
```

## Verify

- Dragging reorders the items, and no arrow buttons show.
