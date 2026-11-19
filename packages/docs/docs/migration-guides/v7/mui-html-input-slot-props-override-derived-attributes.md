---
title: 'In mui, slotProps.htmlInput step, min, max and accept now take precedence'
description: '`@rjsf/mui` used to overwrite a `step`, `min`, `max` or `accept` passed through `slotProps.htmlInput` with the derived value; yours now wins. Remove a workaround value you added, or the browser step-checks against it.'
packages: ['@rjsf/mui']
uses: [ui-schema, custom-widgets]
schema: []
affects: [code, experience]
related: [custom-base-input-template-forwards-input-mode-and-pattern]
---

## Detect

- In your `@rjsf/mui` form: `step`, `min`, `max` or `accept` passed through `slotProps.htmlInput` or `ui:options.mui.slotProps.htmlInput`.
- On the rendered page: the browser rejects a value on submit with a step or range message that follows your value instead of the schema's.

## Change

`@rjsf/mui` now applies the derived input attributes before `slotProps.htmlInput`, so the value you pass takes precedence instead of being overwritten. A value you added to work around the old overwriting now takes effect. For example, a `{ "type": "integer", "multipleOf": 5 }` field given `slotProps={{ htmlInput: { step: 1 } }}` is step-checked by the browser against `1`. Remove such workarounds:

```diff
 const uiSchema = {
   count: {
-    'ui:options': { mui: { slotProps: { htmlInput: { step: 1 } } } },
   },
 };
```

`BaseInputTemplateMuiProps['slotProps']['htmlInput']` is typed as `InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>`, or MUI's `(ownerState) => props` returning them, so those `<input>`-only attributes are accepted.

## Verify

- The rendered input carries the attributes you meant, and the browser accepts every value the schema allows.
