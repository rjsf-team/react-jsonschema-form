---
title: 'FieldTemplateProps.rawHelp can be a React element'
description: '`rawHelp` used to be a `string` and `undefined` for an element `ui:help`; it is now `string | ReactElement`. Narrow it before using it as a string, and destructure it out before spreading props onto a DOM node.'
packages: ['@rjsf/core']
uses: [custom-templates, typescript]
schema: []
kind: runtime
noticed: type-error
related: []
---

## Detect

- In your custom `FieldTemplate`: `rawHelp` used as a `string`, such as `rawHelp.length`, in a template literal, or passed to a `string`-typed prop.
- In the type checker: `TS2339: Property 'length' does not exist on type 'string | ReactElement<unknown, string | JSXElementConstructor<any>>'.`, or `TS2322: Type 'string | ReactElement<unknown, string | JSXElementConstructor<any>>' is not assignable to type 'string'.`
- In your custom `FieldTemplate`: leftover props spread onto a DOM node, which renders `rawhelp="[object Object]"` for an element `ui:help`.

## Change

`rawHelp` carries whatever `ui:help` resolved to, so a `FieldTemplate` gating on `{rawHelp && help}` now renders an element help too. A string `ui:help` is unaffected. Narrow it where you need a string, to recover the old value exactly:

```diff
-const helpText = rawHelp;
+const helpText = typeof rawHelp === 'string' ? rawHelp : undefined;
```

Destructure `rawHelp` out of the props you spread onto a DOM node. React warns about the unrecognized prop either way, but an element renders as `rawhelp="[object Object]"`.

## Verify

- Your template compiles, a field with an element `ui:help` shows it, and the DOM carries no `rawhelp` attribute.
