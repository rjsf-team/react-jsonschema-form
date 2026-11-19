---
title: Mantine's SelectWidget keeps its value under a schema default
description: "A single `@rjsf/mantine` `SelectWidget` whose schema has a `default` no longer clears when its selected option is clicked again. Set `allowDeselect` or `clearable` in `ui:options` to let users clear it."
packages: ['@rjsf/mantine']
uses: [form]
schema: [defaults, enums, any-of-one-of]
affects: [experience]
related: []
---

## Detect

- In your schema: a single-select field, or an `anyOf`/`oneOf` field whose option selector is a select, with a `default`.
- On the rendered page: clicking the selected option again leaves it selected, where it used to clear the field.

## Change

The other themes leave out their empty option under a default, and `@rjsf/mantine` now matches them, so an `anyOf`/`oneOf` option selector can't be cleared to no option and drop the field's data ([#5527](https://github.com/rjsf-team/react-jsonschema-form/issues/5527)). To let such a field be cleared, set `allowDeselect` or `clearable` in its `ui:options`:

```diff
  color: {
+   'ui:options': { clearable: true },
  },
```

## Verify

- Without the option, clicking the selected option keeps the value.
- With `allowDeselect` or `clearable`, users can clear the field as before.
