---
title: getChakra() takes the merged ui options instead of a uiSchema
description: "`getChakra()` now takes the merged ui options and returns `JsxStyleProps`, so a uiSchema argument no longer compiles. Pass the widget's `options`, or `getUiOptions(uiSchema, registry.globalUiOptions)` in a template that has none."
packages: ['@rjsf/chakra-ui']
uses: [custom-widgets, custom-templates, typescript]
schema: []
kind: removal
noticed: type-error
related: [chakra-ui-applies-chakra-option, chakra-ui-chakra-option-takes-style-props-only]
---

## Detect

- Your custom widget or template calls `getChakra(uiSchema)` or `getChakra({ uiSchema })`.
- The type checker reports an error on that call, since a uiSchema no longer fits the parameter.
- Your code types the result of `getChakra()` as `Field.RootProps`.

## Change

`getChakra()` takes the widget's `options`, the merged ones `getUiOptions()` returns, instead of a uiSchema. A custom widget or template passes its `options`:

```diff
-const chakraProps = getChakra(uiSchema);
+const chakraProps = getChakra(options);
```

A template whose props carry no `options`, such as a `FieldTemplate` or an `ObjectFieldTemplate`, merges them from its `uiSchema` first:

```tsx
const chakraProps = getChakra(getUiOptions(uiSchema, registry.globalUiOptions));
```

It returns `JsxStyleProps` instead of `Field.RootProps`, and keeps every Chakra style prop, including the ones that share a name with an HTML attribute, such as `color` and `width`. It always dropped non-style props such as `invalid`, `required` or `onClick`; set those on your own widget or template instead.

## Verify

- Every `getChakra()` call compiles with an options argument.
- A `chakra` set in `ui:options`, `ui:globalOptions` or `ui:chakra` now styles your custom widget or template, as described in [The chakra-ui widgets apply the chakra option](./chakra-ui-applies-chakra-option.md).
- Style props named like HTML attributes, such as `color` and `width`, now reach the component.
