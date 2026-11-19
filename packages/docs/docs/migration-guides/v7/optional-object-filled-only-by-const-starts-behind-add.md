---
title: An optional object only an object const fills starts behind its Add button
description: Under the Optional Data Controls, an optional object whose only value is an object `const` used to start filled with it, and now starts behind Add and out of the data. Give it a `default` holding the `const`, or list it in its parent's `required`.
packages: ['@rjsf/core']
uses: [ui-schema]
schema: [enums, defaults]
affects: [data, appearance]
related: [optional-data-controls-read-typeless-options-as-field-type]
---

## Detect

- Your `enableOptionalDataFieldForType` names `object`.
- An optional object in your schema gets its only value from an object `const`: its own, an `allOf` member's or that of the `anyOf`/`oneOf` option it shows.
- The form's initial data, in tests or `onChange`, no longer holds that object. With this schema the form started as `{ "x": { "a": 2 } }` and now starts as `{}`:

```json
{
  "type": "object",
  "properties": { "x": { "type": "object", "const": { "a": 2 }, "properties": { "a": { "type": "number" } } } }
}
```

## Change

The object now starts behind its Add button and stays out of the form data, as an object nothing fills does. The `const` fills it once the user adds it. To keep it filled from the start, give it a `default` holding the `const`, or list it in its parent's `required`:

```diff
- "x": { "type": "object", "const": { "a": 2 } }
+ "x": { "type": "object", "const": { "a": 2 }, "default": { "a": 2 } }
```

## Verify

- The form starts with the object filled again.
- Anything else that gives the object a value still opens it: a `default` of its own or of one of its properties, a default its parent hands it, or a `ui:initialValue`.
