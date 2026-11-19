---
title: schema, uiSchema and registry props are read-only
description: '`schema`, `uiSchema` and `registry` are now `readonly` on every field, widget and template props type and on `SubmitButtonProps`. Spread a copy into a local variable instead of assigning to the prop.'
packages: ['@rjsf/utils']
uses: [typescript, custom-fields, custom-widgets, custom-templates]
schema: []
affects: [code]
related: [registry-members-are-read-only]
---

## Detect

- `props.schema =`, `props.uiSchema =` or `props.registry =` in a custom field, widget, template or submit button.
- Type checker: `Cannot assign to 'schema' because it is a read-only property.` (or the same for `uiSchema` / `registry`).

## Change

The props now carry `readonly` on `RJSFBaseProps`, which every field, widget and template props type extends, and on `SubmitButtonProps`. The form builds these values and passes them down. Writing into them never reached the form.

Spread a copy and use that instead:

```diff
-props.schema = { ...props.schema, title: 'Custom' };
+const schema = { ...props.schema, title: 'Custom' };
```

The props are read-only, not deeply immutable. The objects behind them are shared with the form, so mutating `props.schema.title` in place is still a bug even though it compiles. The registry's own members changed too, see [Registry members are read-only](./registry-members-are-read-only.md).

## Verify

- The type checker no longer reports a read-only assignment on these props.
- No custom component mutates a nested value such as `props.schema.title` in place.
