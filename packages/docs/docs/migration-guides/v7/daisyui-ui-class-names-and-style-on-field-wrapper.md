---
title: daisyUI applies ui:classNames and ui:style once, on the field wrapper
description: "`ui:classNames` used to land on both the field wrapper and its inner `.field-template` div, and `ui:style` on the inner div alone. Both now go on the wrapper, so point CSS and tests at it."
packages: ['@rjsf/daisyui']
uses: [ui-schema, markup]
schema: []
kind: markup
noticed: test
related: [daisyui-wrap-if-additional-template-applies-style]
---

## Detect

- In your CSS or tests, a selector that reaches a field's `ui:classNames` on `.field-template`, or reads its `ui:style` off that element.
- In your `uiSchema`, a `ui:classNames` that draws a border or padding, which used to render twice, one nested inside the other.

## Change

`@rjsf/daisyui`'s `FieldTemplate` applied `ui:classNames` twice: once on the `WrapIfAdditionalTemplate` wrapper it renders every field in, and again on its own inner `field-template` div. It applied `ui:style` to that inner div alone ([#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327)). Both now go to the wrapper, the way `@rjsf/core` and every other theme applies them.

Move selectors and assertions to the wrapper above `.field-template`.

`ui:options.daisy`'s own `className`, `style` and `theme` are unaffected. They still style the inner div, which is the theme's per-field theming.

## Verify

- A border or padding from `ui:classNames` draws once.
- `ui:style` and `ui:classNames` are on the same element, the wrapper.
- If you register your own `WrapIfAdditionalTemplate`, it now has to apply `style`; see [A daisyUI WrapIfAdditionalTemplate of your own applies ui:style](./daisyui-wrap-if-additional-template-applies-style.md).
