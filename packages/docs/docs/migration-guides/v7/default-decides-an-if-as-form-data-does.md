---
title: A default decides an if as the same value in the form data does
description: "An `if-then-else` or `dependencies` `oneOf` branch was picked from the form data alone, and is now picked with the computed defaults filled in, so the form starts as it was after its first change. Update tests and stored starting data, or pass `formData`."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, utils-api]
schema: [defaults, any-of-one-of]
kind: runtime
noticed: review
related: [defaults-fill-more-then-dependency-and-ref-option-shapes]
---

## Detect

- In your schema, an `if`, or a `dependencies` `oneOf`, that reads a property with a `default`.
- In your tests or stored values, the form data such a form starts with, or a `getDefaultFormState()` result for it.

## Change

The branch of an `if-then-else` was picked from the form data alone. The form started with the defaults of the branch that empty data selects, and moved to those the `default` selects on its first change. It is now picked from the form data with the computed defaults filled in, in `Form` and in `getDefaultFormState()`, so the form starts with what it used to hold after its first change:

- An `if` that lists the defaulted property in `required` left its `then` defaults out, and now fills them in.
- An `if` without `required` that the `default` does not match filled its `then` defaults in, and now fills those of its `else`.
- With one `allOf` entry per `enum` value, the first entry that defaults a property won, and the entry the `default` matches now does.
- A `dependencies` entry's `oneOf`, and a `oneOf` beside `dependencies`, was matched against the form data with only the top-level defaults the data leaves out. A nested `default` under a property the data holds, such as `{}`, didn't count. The option that nested `default` matches now gives its defaults.

With this schema, the form started as `{ "animal": "Cat", "food": "grass" }` and now starts as `{ "animal": "Cat", "food": "meat" }`:

```json
{
  "type": "object",
  "properties": { "animal": { "type": "string", "enum": ["Cat", "Fish"], "default": "Cat" } },
  "allOf": [
    {
      "if": { "properties": { "animal": { "const": "Fish" } } },
      "then": { "properties": { "food": { "type": "string", "default": "grass" } } }
    },
    {
      "if": { "properties": { "animal": { "const": "Cat" } } },
      "then": { "properties": { "food": { "type": "string", "default": "meat" } } }
    }
  ]
}
```

Update the tests and stored values that expect the earlier starting data. A value the form data holds still wins over a default, so to start a form with another value, pass it in `formData`:

```diff
- <Form schema={schema} validator={validator} />
+ <Form schema={schema} validator={validator} formData={{ food: 'grass' }} />
```

## Verify

- The form starts with the defaults of the branch its `default` selects, and its first change doesn't swap them.
- A schema whose branch takes back the `default` that selects it, such as an `else` defaulting a property to the value its `if` tests for and a `then` defaulting it to another, has no starting data its own defaults select. Its branch is still picked from the form data alone. The other `if`s of the same schema pick theirs with the defaults filled in, including one that reads the default that branch fills.
- Where a `dependencies` entry, or the option of a `oneOf` beside or inside `dependencies`, also changes with that branch, every branch of the schema is picked from the form data alone. See [`allOf`](../../api-reference/form-props.md#allof) under `defaultFormStateBehavior` for each case.
