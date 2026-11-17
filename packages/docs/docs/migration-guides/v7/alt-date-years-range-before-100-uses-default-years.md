---
title: AltDateWidget uses the default years for a yearsRange reaching before 100
description: "An `AltDateWidget` given a `yearsRange` reaching before 100 or after 9999 used to offer it as given, and now shows the default years from 1900. Start the range at 100 or later."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema]
schema: [dates]
kind: runtime
noticed: review
related: []
---

## Detect

- Your uiSchema gives an `AltDateWidget` or `AltDateTimeWidget` a `yearsRange` whose years reach before 100 or after 9999, such as `[50, 2030]`. A relative range counts, once it is counted back from the current year.
- On the rendered page, the year select offers 1900 to two years from now, or a stored year such as 1500 shows as blank.

## Change

`useAltDateWidgetProps()`, and so the `AltDateWidget` of `@rjsf/core` (which most themes fall back to), `@rjsf/antd`, `@rjsf/chakra-ui` and `@rjsf/mantine`, show the default years, 1900 to two years from now, for such a range. They used to offer it as given, but wrote a year before 100 as 19xx, since `Date.UTC()` reads 0-99 that way. A range such as `[50, 2030]` now loses all its own years. Start the range at 100 or later to keep them:

```diff
- 'ui:options': { yearsRange: [50, 2030] },
+ 'ui:options': { yearsRange: [100, 2030] },
```

## Verify

- The year select offers the range you set.
- A stored year inside your range shows selected.

## If you can't preserve it

Years before 100 can't be offered. A stored year before 100 shows as blank.
