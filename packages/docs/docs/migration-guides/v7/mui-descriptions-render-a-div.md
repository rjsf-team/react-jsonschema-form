---
title: MUI descriptions render a div instead of an h6 heading
description: "`@rjsf/mui`'s `DescriptionField` rendered each description as an `h6`, listing it among the form's headings. It now renders a `div` with the same look; update selectors, or set `descTypography.component` to `h6` to keep the heading."
packages: ['@rjsf/mui']
uses: [markup]
schema: []
affects: [appearance, experience]
related: []
---

## Detect

- In your CSS or tests, a selector or query that finds a field's description, or a selected option's, as an `h6` or by the `heading` role.
- Snapshot tests of `@rjsf/mui` forms with descriptions.

## Change

`DescriptionField` rendered each description as an `<h6>` heading, which listed every description among the form's headings. It now renders a `div` with the same look.

To get the `<h6>` back, give the description's `Typography` a `component`, in a field's `ui:options` or for every field in `ui:globalOptions`. A field with its own `ui:options.mui` needs it there too:

```diff
 const uiSchema = {
   'ui:globalOptions': {
+    mui: { rjsfSlotProps: { descTypography: { component: 'h6' } } },
   },
 };
```

## Verify

Descriptions no longer appear in `getAllByRole('heading')`, unless you set the `h6` component back.
