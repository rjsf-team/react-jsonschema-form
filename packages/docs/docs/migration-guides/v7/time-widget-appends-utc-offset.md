---
title: TimeWidget appends the local UTC offset to a time value
description: 'The `TimeWidget` of core, daisyui and mantine now appends the browser offset to a `format: "time"` value when it changes, giving `14:30:00-04:00` in place of `14:30:00`. Make the code that reads the value accept an offset, or switch the field to `iso-time`.'
packages: ['@rjsf/core', '@rjsf/daisyui', '@rjsf/mantine']
uses: [form]
schema: [dates]
affects: [data]
related: [validator-ajv8-time-format-requires-timezone-offset]
---

## Detect

- In your schema: `format: "time"` on a string field.
- In `onChange`/`onSubmit` data, your backend or test assertions: a time value such as `14:30:00-04:00` where it used to be `14:30:00`.

## Change

`@rjsf/core`'s `TimeWidget` (used for `format: "time"` by every theme without its own) and the `TimeWidget`s of `@rjsf/daisyui` and `@rjsf/mantine` now append the browser's local UTC offset to the value whenever it changes. The stored value then satisfies the JSON Schema `time` format, which `@rjsf/validator-ajv8` now enforces (see [validator-ajv8 rejects a time value without a timezone offset](./validator-ajv8-time-format-requires-timezone-offset.md)). The offset is stripped back off for display in the time input. `format: "date-time"` and `alt-datetime` already emitted `Z`-suffixed UTC strings and are unaffected.

When the widget resaves a stored value, it reads the wall-clock time in the browser's current offset. A value that already carried a different offset ends up naming a different instant.

Make the code that reads the value accept an offset, for example by parsing it as an RFC 3339 `full-time`.

To keep values without an offset, change the field's schema to `format: "iso-time"`. The same widget renders it and adds no offset. A stored value that carries one anyway is still stripped for display.

```diff
 "startsAt": {
   "type": "string",
-  "format": "time"
+  "format": "iso-time"
 }
```

## Verify

- Picking a time in a `format: "time"` field yields a value ending in your browser's offset (`Z` or `+HH:MM`/`-HH:MM`), and the input still shows only the time.
- A field switched to `format: "iso-time"` yields the time with no offset.
