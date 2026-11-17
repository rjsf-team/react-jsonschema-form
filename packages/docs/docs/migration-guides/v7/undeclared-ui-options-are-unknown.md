---
title: A ui option RJSF does not declare reads as unknown
description: 'An option `UIOptionsType` doesn''t declare, read from `ui:options`, a `ui:` key or a widget''s `options`, was `any` and is now `unknown`. Check its type before use.'
packages: ['@rjsf/utils']
uses: [typescript, custom-widgets, custom-templates, custom-fields]
schema: []
kind: type
noticed: type-error
related: [ui-options-types-the-options-widgets-read, ui-schema-entries-are-unknown]
---

## Detect

- In your code: a custom widget, field, template or theme that reads an option of its own from `options`, `ui:options` or a uiSchema's `ui:` key and uses it as a specific type.
- The type checker reports `'size' is of type 'unknown'.` (TS18046), or that `unknown` is not assignable to the type you use it as.

## Change

An option a theme or custom component reads from `ui:options` that RJSF doesn't declare is `unknown`, so check its type before use:

```diff
-const { size = 'md' } = props.options;
+const size = typeof props.options.size === 'string' ? props.options.size : 'md';
```

The options RJSF's own widgets read are declared with their types, see [ui:options types the options RJSF's widgets read](./ui-options-types-the-options-widgets-read.md). Entries read from an untyped uiSchema are `unknown` too, see [Entries read from an untyped UiSchema are unknown](./ui-schema-entries-are-unknown.md).

## Verify

- The type checker accepts each read of your own options.
- A value of the wrong type falls back to your default instead of reaching your component.
