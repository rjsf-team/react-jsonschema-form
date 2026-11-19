---
title: 'Change event members are read-only'
description: 'Every member of the `IChangeEvent` that `onChange` and `onSubmit` receive is now `readonly`, so assigning into the event fails to compile. Copy what you need out of the event into your own state instead.'
packages: ['@rjsf/core']
uses: [typescript, form-props]
schema: []
affects: [code]
related: [change-event-edit-removed, form-data-is-frozen-in-development]
---

## Detect

- In your `onChange` or `onSubmit` handlers: an assignment to a member of the event, such as `event.formData = normalize(event.formData)`.
- In the type checker: `TS2540: Cannot assign to 'formData' because it is a read-only property.`

## Change

`IChangeEvent` is now declared on its own instead of as a `Pick` of the `Form`'s internal state, and every member is `readonly`. Readonly modifiers don't affect assignability, so a handler that reads the event or passes it on compiles as before. Only code that assigns into the event breaks:

```diff
-onChange={(event) => { event.formData = normalize(event.formData); setData(event.formData); }}
+onChange={(event) => setData(normalize(event.formData))}
```

The modifier is shallow. It stops `event.formData = ...` and leaves a write inside `formData` compiling, so treat the whole event as immutable. Received form data must not be mutated at any depth; see [Form data is deep-frozen in development](./form-data-is-frozen-in-development.md).

## Verify

- Your handlers compile and copy data out of the event before changing it.
- Nothing writes inside `event.formData` or any other member of the event.
