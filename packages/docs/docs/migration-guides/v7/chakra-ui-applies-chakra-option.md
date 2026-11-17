---
title: The chakra-ui widgets apply the chakra option
description: "The `chakra` option in a uiSchema used to reach no widget and now styles the field, whether set in `ui:options`, `ui:globalOptions` or `ui:chakra`. Remove the option wherever you don't want that styling."
packages: ['@rjsf/chakra-ui']
uses: [ui-schema]
schema: []
kind: runtime
noticed: review
related: [chakra-ui-get-chakra-takes-options, chakra-ui-chakra-option-takes-style-props-only]
---

## Detect

- Your uiSchema sets a `chakra` option in `ui:options`, under the `ui:chakra` shorthand, or in `ui:globalOptions`, for a form rendered with `@rjsf/chakra-ui`.

## Change

The `chakra` option never reached a widget: each one called `getChakra({ uiSchema })`, and `getChakra()` read `ui:options` off that wrapper and found none. The widgets now apply it, so a uiSchema that carries a `chakra` option changes how its field looks. A `chakra` set through `ui:globalOptions` or `ui:chakra` applies as one in `ui:options` does.

Remove the option where the styling is not wanted:

```diff
 const uiSchema = {
   name: {
-    'ui:options': { chakra: { width: '50%' } },
   },
 };
```

## Verify

- Fields whose uiSchema sets `chakra` render with those style props, and nowhere else.
- A custom widget or template that calls `getChakra()` itself needs the change in [getChakra() takes the merged ui options](./chakra-ui-get-chakra-takes-options.md).
