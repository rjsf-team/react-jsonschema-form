---
title: The items of an array's default ignore an additionalItems beside items
description: "An array whose `items` is one schema filled its `default`'s items with its `additionalItems` defaults too, and now fills them from `items` alone, as an added row is. State the value in the `default`'s item, or declare its default in `items`."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [arrays, defaults]
affects: [data]
---

## Detect

- In your schema, an array with a `default`, an `items` that is a single schema, and an `additionalItems` beside it whose properties have defaults.

## Change

`additionalItems` describes only the items past a tuple's positions. The items of the `default` used to take its defaults anyway, and are now filled from `items` alone, as a row the user adds is. With this schema, the form started as `[{ "z": 9 }]` and held `[{ "z": 9, "q": 1 }]` once the array was in the data. It now starts as `[{ "q": 1 }]` and keeps it. Under `defaultFormStateBehavior.arrayMinItems.populate: 'never'` it started as `[{ "z": 9 }]` and now starts as `[{}]`, as it held once the array was in the data:

```json
{
  "type": "array",
  "default": [{}],
  "items": { "type": "object", "properties": { "q": { "type": "number", "default": 1 } } },
  "additionalItems": { "type": "object", "properties": { "z": { "type": "number", "default": 9 } } }
}
```

To keep the value, state it in the item of the `default`, or declare its default in `items`:

```diff
- "default": [{}],
+ "default": [{ "z": 9 }],
```

## Verify

- The array starts with the item values you expect, and keeps them once it is in the data.
