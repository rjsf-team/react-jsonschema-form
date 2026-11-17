---
title: validator-ajv8 rejects a time value without a timezone offset
description: '`@rjsf/validator-ajv8` now uses `ajv-formats` 3, which fails a `format: "time"` value such as `14:30:00` that has no `Z` or `+HH:MM` offset. Backfill stored values with an offset, let the widget resave them, or switch the field to `iso-time`.'
packages: ['@rjsf/validator-ajv8']
uses: [form]
schema: [dates]
kind: runtime
noticed: test
related: [time-widget-appends-utc-offset]
---

## Detect

- In your schema: `format: "time"`, with saved `formData` for that field like `14:30:00` (no `Z`, no `+HH:MM`/`-HH:MM`).
- On the rendered page or in your tests: a format error on a time field loaded from that saved data, and submit blocked by it.
- In your lockfile: `ajv-formats` resolves to 3.x under `@rjsf/validator-ajv8` (it was 2.x).

## Change

`@rjsf/validator-ajv8` now depends on `ajv-formats` 3.x. Per [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6), `ajv-formats` 3 requires a `time` value to include a timezone offset (`Z`, or `+HH:MM`/`-HH:MM`). The offset used to be optional for `time` alone. `date-time` already required one in `ajv-formats` 2.x and is unaffected.

Stored `time` values without an offset now fail validation. Pick one of these:

- Let the widget resave the value the next time a user edits the field. `TimeWidget` now appends the browser's local offset on change (see [TimeWidget appends the local UTC offset to a time value](./time-widget-appends-utc-offset.md)). It reads the wall-clock value in the browser's current offset, so a value entered in another timezone ends up naming a different instant.
- Backfill the stored data with an explicit offset, for example treating legacy values as UTC and appending `Z`.
- Keep accepting offset-less values for a field by changing its schema to `format: "iso-time"` (or `format: "iso-date-time"` in place of `format: "date-time"`). `ajv-formats` 3 added these as formats whose timezone is optional. RJSF renders them with the same `TimeWidget`/`DateTimeWidget` (including the `DateTimeWidget`s of `@rjsf/antd` and `@rjsf/daisyui`) and adds no offset for them, so their values behave as `format: "time"`/`format: "date-time"` did before. A stored value that carries an offset anyway is still stripped for display.

```diff
 "startsAt": {
   "type": "string",
-  "format": "time"
+  "format": "iso-time"
 }
```

## Verify

- The form loads the saved time values without a format error and submits them.
- With `iso-time`, the value a user picks is stored without an offset.
