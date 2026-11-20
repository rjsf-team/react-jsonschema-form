---
title: The root keeps a value outside its enum, and a NaN
description: "A root field with no `default` dropped form data its `enum` doesn't offer, and a `NaN`, where a property kept them; the root now keeps them too. Give the root a `default` to replace such a value."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [defaults, enums, numbers]
affects: [data]
related: [constant-options-replace-a-value-outside-them-with-the-default]
---

## Detect

- In your schema: a root field that isn't an object, with no `default` of its own or through an `allOf`.
- In your form data: a value its `enum` doesn't offer, or a `NaN`.

## Change

Such a value was dropped at the root, where a property kept it, and is now kept as a property keeps it ([#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895)). With `{ "type": "string", "enum": ["red", "green"] }` and `formData` of `"blue"`, the result was `undefined` and is now `"blue"`. With `{ "type": "number" }` and `formData` of `NaN`, it was `undefined` and is now `NaN`.

To replace such a value, give the root field a `default`:

```diff
-{ "type": "string", "enum": ["red", "green"] }
+{ "type": "string", "default": "red", "enum": ["red", "green"] }
```

## Verify

- A root field seeded with a value outside its `enum` starts with the value you expect.
