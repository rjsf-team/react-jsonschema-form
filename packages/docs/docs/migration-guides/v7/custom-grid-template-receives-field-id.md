---
title: A custom GridTemplate is handed a fieldId
description: "`LayoutGridField` now passes every `GridTemplate` a `fieldId`, and a row's `span` no longer reaches it. Take `fieldId` off the props a custom `GridTemplate` spreads onto an element."
packages: ['@rjsf/core']
uses: [custom-templates]
schema: []
kind: runtime
noticed: runtime-error
related: []
---

## Detect

- In your code: a custom `GridTemplate` passed through `templates=` that spreads its props onto an element.
- In the console: React warns about an unknown `fieldId` prop on a DOM element.
- In your code: a `GridTemplate` that reads a `span` on a row.

## Change

`LayoutGridField` hands every `GridTemplate` a `fieldId`, so a theme can name the column in the warnings it logs about a `span`. A column gets the id of the first field it holds; a row, or a column holding no field of its own, gets the id of the field whose layout grid holds it. Take it off before spreading:

```diff
 function GridTemplate(props: GridTemplateProps) {
-  const { children, column, ...rest } = props;
+  const { children, column, fieldId, ...rest } = props;
   return <div {...rest}>{children}</div>;
 }
```

To log the same `span` warnings as the built-in themes, hand `fieldId` to [`logGridSpanWarning()`](../../api-reference/utility-functions.md#loggridspanwarning) along with the column's `span`.

A row's `span` only ever sized a column, so `LayoutGridField` now warns about it on a row and keeps it back from `GridTemplate`. Move such a `span` onto the row's columns.

## Verify

- React logs no warning about `fieldId`.
- `LayoutGridField` logs no warning about a `span` on a row.
