---
title: A date element's range and yearsRange are readonly tuples
description: "A date element's `range` and `options.yearsRange` are now `readonly [number, number]`, so passing them to a `[number, number]` parameter fails. Mark the parameter `readonly` or destructure the range."
packages: ['@rjsf/utils']
uses: [custom-widgets, typescript]
schema: [dates]
kind: type
noticed: type-error
related: [ui-options-types-the-options-widgets-read]
---

## Detect

- Your custom alt-date widget passes a date element's `range` or `options.yearsRange` to a parameter typed `[number, number]`, and the type checker rejects the call.

## Change

Mark the parameter `readonly`, or destructure the range as `@rjsf/mantine`'s `AltDateWidget` does:

```diff
- function yearOptions(range: [number, number]) {
+ function yearOptions(range: readonly [number, number]) {
```

## Verify

- The widget compiles. Nothing changes at runtime. The other typed options are listed in [ui:options types the options RJSF's widgets read](./ui-options-types-the-options-widgets-read.md).
