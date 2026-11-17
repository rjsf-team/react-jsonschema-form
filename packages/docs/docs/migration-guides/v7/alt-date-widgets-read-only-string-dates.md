---
title: The alt-date and alt-datetime widgets show a number or Date value as empty
description: '`useAltDateWidgetProps()` reads only a string now, so the alt-date and alt-datetime widgets of every theme show a number or `Date` as empty. Store the date as the string the widget writes, such as `date.toISOString()` or `YYYY-MM-DD`.'
packages: ['@rjsf/core']
uses: [ui-schema]
schema: [dates]
kind: runtime
noticed: review
related: [widget-value-is-unknown]
---

## Detect

- In your uiSchema: a field with `ui:widget` set to `alt-date` or `alt-datetime`.
- In your form data: that field holds a number or a `Date` object.
- On the rendered page: that widget's selects show nothing selected.

## Change

`useAltDateWidgetProps()` reads only a string, so the alt-date and alt-datetime widgets of every theme show a number or `Date` as empty. They write strings, so a field holding either couldn't keep it. Pass the date as the string the widget writes: a date-time such as `date.toISOString()` for `alt-datetime`, or a `YYYY-MM-DD` date for `alt-date`.

```diff
-const formData = { start: new Date(2024, 0, 31) };
+const formData = { start: new Date(2024, 0, 31).toISOString() };
```

## Verify

- The widget shows the stored date in its year, month and day selects.
- The value your form submits is the same string type you passed in.
