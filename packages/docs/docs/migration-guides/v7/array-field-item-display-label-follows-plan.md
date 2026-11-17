---
title: ArrayFieldItemTemplateProps.displayLabel says whether a label sits above the item's control
description: '`ArrayFieldItemTemplateProps.displayLabel` now comes from the item''s plan and is true only where a label sits above the item''s control. Keep placing the item''s buttons by it, and expect it to change for checkboxes, `null` items, custom fields and MUI.'
packages: ['@rjsf/core']
uses: [custom-templates]
schema: [arrays]
kind: runtime
noticed: review
related: [field-template-reads-the-presentation-plan]
---

## Detect

- `displayLabel` read in a custom `ArrayFieldItemTemplate` in your code.
- On the rendered page, an array item's buttons sit at a different height than before.

## Change

`ArrayFieldItemTemplateProps.displayLabel` now comes from the plan the item's `SchemaField` builds, where it was `getDisplayLabel()` of the item's schema and its own `uiSchema`. It says whether a label sits above the item's control: a label its template draws, which is the `displayLabel` the item's own `FieldTemplate` is handed (see [A custom FieldTemplate, ObjectFieldTemplate or ArrayFieldTemplate draws what the plan hands it](./field-template-reads-the-presentation-plan.md)), or one its field or widget draws itself where its declaration places it `labelPlacement: 'above'`, as `@rjsf/fluentui-rc`, `@rjsf/chakra-ui` and `@rjsf/mantine` declare their widgets' labels. So the item's buttons are placed by the label above its control.

It is now `false` for:

- an item with no label text;
- a `null` item;
- a hidden item;
- a boolean under `ui:widget: 'checkbox'`;
- a custom field drawing its own label, whichever of `ui:field` or a `$id` names it, unless its declaration places that label above;
- in `@rjsf/mui`, whose text inputs and selects draw their label inside the input's outline, those inputs and selects.

It is now `true` for:

- a custom field declared `{ label: 'template' }`;
- a boolean whose titled `oneOf` constants render a select;
- an object `anyOf`/`oneOf`, whose selector its template labels;
- an item the fallback UI (`useFallbackUiForUnsupportedType`) renders with a choice of types, whose type selector comes first and is labelled for the type whatever the item's title, unless `ui:label` is `false` or the item is hidden, which hides the selector with it.

Keep reading `displayLabel` to align the item's buttons with its control, and don't recompute it from the item's schema.

## Verify

Each array item's buttons line up with its control, beside a label above it where there is one.
