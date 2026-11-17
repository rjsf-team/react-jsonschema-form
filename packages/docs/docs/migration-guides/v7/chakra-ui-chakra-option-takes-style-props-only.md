---
title: The chakra option at the uiSchema root accepts only Chakra style props
description: "The theme's `UiSchema` types the `chakra` option as `JsxStyleProps`, so a non-style prop such as `invalid` or `onClick` no longer compiles in the root `ui:options`. Remove it and set it on your own widget or template, since `getChakra()` always dropped it."
packages: ['@rjsf/chakra-ui']
uses: [ui-schema, typescript]
schema: []
kind: type
noticed: type-error
related: [chakra-ui-applies-chakra-option, chakra-ui-get-chakra-takes-options]
---

## Detect

- The `ui:options` at the root of a uiSchema typed with the theme's `UiSchema` sets a `chakra` option with a non-style prop, such as `invalid`, `required` or `onClick`, and the type checker reports `Object literal may only specify known properties, and 'onClick' does not exist in type 'JsxStyleProps'.`
- The same prop under `ui:globalOptions`, typed by `ChakraGlobalUISchemaOptions`, is reported too.

## Change

The `chakra` option of the theme's `UiSchema` type is `JsxStyleProps`. In a nested field's `ui:options` and under `ui:chakra` the option is not typed, so such a prop still compiles there. `getChakra()` always dropped non-style props, wherever they are set, so removing them changes nothing on screen:

```diff
 const uiSchema: UiSchema = {
   'ui:options': {
-    chakra: { width: '50%', onClick: handleClick },
+    chakra: { width: '50%' },
   },
 };
```

Set such props on your own widget or template instead.

## Verify

- The uiSchema compiles.
- Non-style props you still need are passed by a custom widget or template.
