---
title: Mantine's DateWidget and DateTimeWidget can be cleared
description: "`@rjsf/mantine`'s `DateWidget` and `DateTimeWidget` now show a Clear button, and a cleared field stores its `ui:emptyValue` (`undefined` by default) where it stored `''`. Set `clearable: false` to drop the button, and update tests that read `''`."
packages: ['@rjsf/mantine']
uses: [form, ui-schema, markup]
schema: [dates]
affects: [data, experience]
related: [mantine-date-time-widget-renders-date-time-picker]
---

## Detect

- In your schema, a string field with `format: 'date'`, `'date-time'`, `'datetime'` or `'iso-date-time'` rendered by `@rjsf/mantine`.
- On the page, a Clear button in such a field while it holds a value.
- In your tests or code, an expectation that a cleared date field holds `''`.

## Change

The two widgets show a Clear button while they hold a value, unless the field is read-only or disabled. A cleared field, or a `DateWidget` whose text is deleted, stores the field's `ui:emptyValue`, which is `undefined` unless one is set, where it stored `''`. An optional field then leaves the form data, and a required one reports that it is required where it failed its `format`.

Before, a cleared value was only reachable with `ui:options.clearable`, and stored `''`. To keep the field without the button, turn it off. For every field, set `defaultProps: { clearable: false }` on the theme's `DateInput` or `DateTimePicker`:

```diff
  when: {
+   'ui:options': { clearable: false },
  },
```

A test that read `''` from a cleared field reads `undefined`, or the `ui:emptyValue` it sets.

## Verify

- Clearing an optional date field removes it from the form data, and clearing a required one reports that it is required.
- With `clearable: false`, deleting a `DateWidget`'s text doesn't clear it either. Mantine's `DateInput` keeps its date, as it did before.
