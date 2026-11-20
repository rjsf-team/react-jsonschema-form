---
title: Mantine's date parts submit the index of the picked option
description: "Each `@rjsf/mantine` `AltDateWidget` part's hidden input used to hold the part's number and now holds the picked option's index, so January submits `root__month=0`. Read the date from rjsf's `formData` instead."
packages: ['@rjsf/mantine']
uses: [form-props]
schema: [dates]
affects: [data]
related: [mantine-alt-date-parts-render-through-select-widget]
---

## Detect

- In your code: a native form submission, a `FormData` or a server handler that reads a date part of a `@rjsf/mantine` `AltDateWidget` or `AltDateTimeWidget` by its input `name`, such as `root__month`.

## Change

The parts now render through `SelectWidget` (see [Mantine's AltDateWidget renders its date parts through SelectWidget](./mantine-alt-date-parts-render-through-select-widget.md)), which encodes the picked option as its index, as in the other themes. January submits `root__month=0` instead of `root__month=1`. Read the date from rjsf's `formData`:

```diff
-const month = Number(new FormData(formElement).get('root__month'));
+const month = Number(formData.date.split('-')[1]);
```

## Verify

- The date your code reads matches the one picked, including the month.
