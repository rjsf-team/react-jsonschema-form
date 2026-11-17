---
title: antd calls onChangeOverride for a numeric field
description: "`@rjsf/antd` never called an `onChangeOverride` on a number or integer field, and now renders an `Input` that calls it with the `ChangeEvent`. Check your override handles the event, and expect no `InputNumber` stepper on that field."
packages: ['@rjsf/antd']
uses: [custom-widgets]
schema: [numbers]
kind: runtime
noticed: review
related: []
---

## Detect

- In your code: a widget that passes `onChangeOverride` to `@rjsf/antd`'s `BaseInputTemplate` for a `number` or `integer` field.
- On the rendered page: that field now shows a plain input without `InputNumber`'s stepper controls.

## Change

`BaseInputTemplate` used to wire its `InputNumber` branch straight to `onChange`. `InputNumber` reports only the parsed value and never an event, so the override was never called. A numeric field with an `onChangeOverride` now renders the `Input` branch (still `type="number"`), and the override receives the `ChangeEvent`, as `WidgetProps['onChangeOverride']` declares and every other theme does.

Make sure the override reads the value from the event and does what `onChange` used to do for that field:

```tsx
const onChangeOverride = (event: ChangeEvent<HTMLInputElement>) => setSomething(event.target.value);
```

## Verify

- Typing in the field calls your override.
- The field has lost `InputNumber`'s stepper controls and formatting, which the override replaces.
- A numeric field without an `onChangeOverride` still renders `InputNumber`.
