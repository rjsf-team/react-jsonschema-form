---
title: The style template prop and ui:style option are CSSProperties
description: '`style` on `FieldTemplateProps`, in `ui:options` and as `ui:style` used to be typed as a `<style>` element''s props and is now `CSSProperties`. Move keys that aren''t CSS properties, such as `media` or `nonce`, elsewhere.'
packages: ['@rjsf/utils']
uses: [typescript, ui-schema, custom-templates]
schema: []
kind: type
noticed: type-error
related: [grid-template-props-declare-own-props]
---

## Detect

- In your code: a `style` passed to a `FieldTemplate`, or set in `ui:options` or as `ui:style`, holding keys of a `<style>` element such as `media` or `nonce`.
- The type checker reports `Object literal may only specify known properties, and 'media' does not exist in type 'Properties<string | number, string & {}>'.` (TS2353) on that key.

## Change

`style` was typed `StyleHTMLAttributes<any>`, the props of a `<style>` element, so it accepted keys that aren't CSS. It now takes the same `CSSProperties` a `style` prop does. Move anything that isn't a CSS property elsewhere:

```diff
-const uiSchema: UiSchema = { 'ui:style': { media: 'print', color: 'red' } };
+const uiSchema: UiSchema = { 'ui:style': { color: 'red' } };
```

## Verify

- The type checker accepts your `style` values.
- Nothing changes at runtime.
- For the props of a custom `GridTemplate`, see [A custom GridTemplate declares the props it reads from ui:layoutGrid](./grid-template-props-declare-own-props.md).
