---
title: DateElement no longer defaults its className to form-control
description: '`DateElement` in `@rjsf/utils` no longer defaults its `className` to `form-control`, so date selects rendered without one lose that class. A theme that wants it passes `className=''form-control''`.'
packages: ['@rjsf/utils', '@rjsf/shadcn', '@rjsf/fluentui-rc']
uses: [custom-theme, custom-widgets, markup]
schema: [dates]
affects: [appearance]
related: []
---

## Detect

- `DateElement` from `@rjsf/utils` rendered in your theme or widget without a `className`, with a `SelectWidget` that renders the `className` it is handed.
- CSS, tests or snapshots expecting `form-control` on alt-date selects, including those of core's `AltDateWidget`.

## Change

`DateElement` used to default its `className` to Bootstrap 3's `form-control`. It now has no default, so core's `AltDateWidget` no longer puts `form-control` on its date selects. `@rjsf/shadcn`'s alt-date selects lose a class the theme doesn't style. `@rjsf/fluentui-rc`'s `SelectWidget` adds `form-control` itself, so its date selects carry it once instead of twice.

A theme that wants the class passes it:

```diff
-<DateElement {...elemProps} />
+<DateElement {...elemProps} className='form-control' />
```

## Verify

- Date selects carry the classes your theme passes, and snapshots show no `form-control` where none is passed.
