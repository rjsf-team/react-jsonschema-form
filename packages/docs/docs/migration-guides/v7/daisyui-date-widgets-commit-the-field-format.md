---
title: daisyUI's date widgets store the shape the field's format declares
description: "`@rjsf/daisyui`'s date pickers committed a UTC date-time for `format: 'date'` and rewrote values when merely opened. They now commit the shape each format declares, `YYYY-MM-DD` for dates, and only on a pick; migrate stored values and assertions."
packages: ['@rjsf/daisyui']
uses: [form]
schema: [dates]
kind: runtime
noticed: test
related: [daisyui-date-picker-trigger-and-popup-markup-changed]
---

## Detect

- In your schema, a `format: 'date'`, `date-time` or `iso-date-time` field rendered by `@rjsf/daisyui`.
- In your tests or backend, code that reads what its `DateWidget` or `DateTimeWidget` commits, such as an assertion on `2020-05-03T00:00:00.000Z`.
- Stored form data written by v6's daisyUI date widgets.

## Change

`DateWidget` mangled a `format: 'date'` value at both ends ([#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318)).

What a `format: 'date'` field commits:

- It commits `YYYY-MM-DD`, the shape `@rjsf/core`'s native date input and every other theme produce. It used to commit a full UTC date-time such as `2020-05-03T00:00:00.000Z`, which `ajv-formats` rejected as a `date`.
- Closing the picker with no day chosen commits `ui:emptyValue` (`undefined` by default) instead of `''`, which failed that format the same way.

How stored values are read:

- A stored value carrying a time names the day its own text spells, whatever separator, time and zone follow it, so a `2020-05-03T00:00:00.000Z` or a `2020-05-03T12:00:00+02:00` reads as 3 May.
- The exception is what v6 stored, `toISOString()` of the local midnight beginning the day the user picked. A value that spells that instant in UTC and lands on local midnight names that local day, however a backend writes it back: with or without the seconds and zero fraction, a space for the `T`, and `Z`, `+00:00`, `+0000` or `+00` for the zone. A value with an offset of its own, or a lowercase `t`, is read as its text reads.
- `DateWidget` reads an `iso-date-time` field as the day its text names, as `DateTimeWidget` does ([#5395](https://github.com/rjsf-team/react-jsonschema-form/issues/5395)). v6's exception doesn't apply to that format, so a value v6 stored in an `iso-date-time` field under `ui:widget: 'date'` reads as the day before the one picked, for anyone ahead of UTC, until the day is picked again.
- `DateTimeWidget` reads a field by its format the same way. In a `format: 'date'` field it shows the day a stored date-time names, at the start of that day, where it used to show the instant, which behind UTC is the evening before.
- A value the widget cannot read at all is left alone when the picker is dismissed, where it used to be replaced by the empty value.

Neither picker stores anything unless the user chose a date. Opening a picker and dismissing it used to commit whatever it was holding, so a `format: 'date'` field holding a date-time had the day the widget read out of it written back over the value. A `format: 'date-time'` or `iso-date-time` field is left alone the same way, including the seconds neither picker can set.

Either picker commits the shape the field's `format` declares, whatever its own name suggests: a date for `format: 'date'`, a UTC ISO string for `date-time`, and a naive local date-time for `iso-date-time`. `widgetMap` resolves `ui:widget: 'date'` and `ui:widget: 'date-time'` on any `string` schema, so `{ 'ui:widget': 'date' }` on a `format: 'date-time'` field used to commit a value that field's own format rejects, and `{ 'ui:widget': 'date-time' }` on a `format: 'date'` field likewise.

Update assertions to the new shape:

```diff
-expect(formData.when).toBe('2020-05-03T00:00:00.000Z');
+expect(formData.when).toBe('2020-05-03');
```

## Verify

- A `format: 'date'` field commits `YYYY-MM-DD` and passes validation.
- Stored v6 `format: 'date'` values show the day the user picked.
- Opening and dismissing a picker leaves the form data unchanged.
- Check `iso-date-time` fields that v6 rendered with `ui:widget: 'date'` for values a day early.
