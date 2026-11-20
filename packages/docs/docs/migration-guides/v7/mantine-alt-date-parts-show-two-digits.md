---
title: Mantine's date parts show two digits and are not required
description: "A `@rjsf/mantine` month, day, hour, minute or second part now shows two digits, and a part is no longer required when its field is. Pick options by `01` instead of `1` in tests and drop checks for a required part."
packages: ['@rjsf/mantine']
uses: [markup]
schema: [dates]
affects: [experience, appearance]
related: [mantine-alt-date-parts-render-through-select-widget]
---

## Detect

- In your tests: a query that picks or reads a date part's option by text such as `'1'`, which no longer finds it.
- In your tests or CSS: a check that a date part is `required`.

## Change

A month, day, hour, minute or second shows two digits, as in the other themes. Update tests that pick or read an option by its text:

```diff
-await user.click(screen.getByRole('option', { name: '1' }));
+await user.click(screen.getByRole('option', { name: '01' }));
```

A part is also no longer required when its field is, as in the other themes, since a required native select blocks the submit of a date picked only in part. Drop assertions that expect a part to be required.

## Verify

- Tests find the options by their two-digit text.
- Submitting a date picked only in part reaches validation instead of being blocked by the browser.
