---
title: Mantine's onChangeOverride receives the change event
description: "`@rjsf/mantine`'s `BaseInputTemplate` used to call `onChangeOverride` with the input's string value and now passes the `ChangeEvent`. Read the value from `event.target.value`."
packages: ['@rjsf/mantine']
uses: [custom-widgets]
schema: []
kind: runtime
noticed: review
related: [number-fields-render-text-input]
---

## Detect

- In your code: a widget that passes `onChangeOverride` to `@rjsf/mantine`'s `BaseInputTemplate` and types or uses its argument as a `string`.
- On the rendered page: the value your override stores is an event object instead of the text typed.

## Change

The theme used to route `onChange` and `onChangeOverride` through one variable and hand both the value. Every other theme, and `@rjsf/core`'s own `BaseInputTemplate`, pass the raw `ChangeEvent`, and `@rjsf/mantine` now does too. Read the value off the event:

```tsx
// Before
const onChangeOverride = (value: string) => setSomething(value);

// After
const onChangeOverride = (event: ChangeEvent<HTMLInputElement>) => setSomething(event.target.value);
```

An `onChangeOverride` bypasses `onChange` entirely, so `ui:emptyValue`, which `@rjsf/core` applies when the input is cleared, doesn't reach it. Handle an empty string yourself if you need that behaviour.

## Verify

- Typing in the field calls your override with an event, and the stored value matches the text typed.
- A numeric field with an `onChangeOverride` now renders Mantine's `TextInput` instead of its `NumberInput`, which reports only the parsed value and never an event. The input keeps `type="number"` (`@rjsf/core`'s `<input>` no longer does, see [Number fields render a text input](./number-fields-render-text-input.md)). Your override handles that input, so the stepper controls and number formatting of `NumberInput` are gone.
- Clearing the field gives your override an empty string, which you map to the empty value you want.
