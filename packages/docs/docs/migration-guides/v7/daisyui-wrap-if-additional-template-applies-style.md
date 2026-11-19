---
title: A daisyUI WrapIfAdditionalTemplate of your own applies ui:style
description: "daisyUI's field wrapper now applies both `ui:classNames` and `ui:style`, so a custom `WrapIfAdditionalTemplate` that ignores `style` drops every `ui:style`. Apply `style` beside `classNames` in both of its branches."
packages: ['@rjsf/daisyui']
uses: [custom-templates]
schema: []
affects: [code, appearance]
related: [daisyui-ui-class-names-and-style-on-field-wrapper]
---

## Detect

- In your code, a `WrapIfAdditionalTemplate` registered with `@rjsf/daisyui` that renders `classNames` and never reads `style`.
- On the rendered page, a field's `ui:style` has no effect.

## Change

The wrapper is now what applies `ui:classNames` and `ui:style` ([#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327)). Ignoring `style` was harmless in v6, since the inner `field-template` div applied it. Now a template that renders `<div className={classNames}>` silently drops every `ui:style`.

Apply `style` alongside `classNames` on the element you return, in the plain branch as well as the additional-property one:

```diff
 if (!additional) {
-  return <div className={classNames}>{children}</div>;
+  return <div className={classNames} style={style}>{children}</div>;
 }
```

## Verify

A field with a `ui:style`, plain or an additional property, shows that style on the element your template returns.
