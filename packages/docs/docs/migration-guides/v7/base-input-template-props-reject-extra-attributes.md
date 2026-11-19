---
title: BaseInputTemplateProps rejects input attributes it does not declare
description: '`BaseInputTemplateProps` used to accept any attribute and now declares only `type`, `pattern` and `accept`. To pass others, annotate the registry''s `BaseInputTemplate` with your theme''s props type, such as `MuiBaseInputTemplateProps`.'
packages: ['@rjsf/core', '@rjsf/utils', '@rjsf/daisyui', '@rjsf/mui', '@rjsf/react-bootstrap', '@rjsf/shadcn']
uses: [typescript, custom-widgets]
schema: []
affects: [code]
related: [field-and-widget-props-reject-undeclared-props]
---

## Detect

- In your code: a widget that renders `registry.templates.BaseInputTemplate` with an attribute such as `maxLength`, `min` or `autoComplete`, or with a theme prop such as mui's `multiline` or an `extraProps`.
- The type checker reports TS2322 (`… is not assignable to type …`) on that JSX, naming the extra attribute.

## Change

`BaseInputTemplateProps` declares the `type`, `pattern` and `accept` the widgets set on the input, so passing it another input attribute, such as `maxLength`, `min` or `autoComplete`, is a type error. A widget that passes a theme's own props to the registry's `BaseInputTemplate` reads it typed with them:

- `@rjsf/core`'s `CoreBaseInputTemplateProps` takes the `<input>` attributes. Use it for `@rjsf/daisyui` too, which renders core's template.
- `@rjsf/mui`'s `MuiBaseInputTemplateProps` takes the `TextField` props.
- `@rjsf/react-bootstrap`'s `BootstrapBaseInputTemplateProps` and `@rjsf/shadcn`'s `ShadcnBaseInputTemplateProps` take an `extraProps`, which also takes `data-*` attributes.

```diff
-const { BaseInputTemplate } = registry.templates;
+const BaseInputTemplate: SlotComponent<MuiBaseInputTemplateProps> = registry.templates.BaseInputTemplate;
 return <BaseInputTemplate {...props} multiline rows={3} />;
```

## Verify

- The type checker accepts the JSX that renders `BaseInputTemplate` with your attributes.
- The annotation trusts the registered template rather than checking it: a `BaseInputTemplate` an app registers that ignores `multiline` still compiles, and renders a single-line input. Check the input renders with your attributes in the theme you use.
