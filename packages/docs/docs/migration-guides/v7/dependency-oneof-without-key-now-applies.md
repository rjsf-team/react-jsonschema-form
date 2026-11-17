---
title: A dependencies oneOf whose options don't declare the key is now applied
description: A `oneOf` under `dependencies` whose options don't declare the dependency's key used to be dropped with an `ignoring oneOf in dependencies` warning, and now merges the option the data matches. Check the fields and defaults it brings in.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [any-of-one-of, defaults]
kind: runtime
noticed: review
related: [dependency-anyof-merges-without-selector]
---

## Detect

- Your schema has a `oneOf` directly under a `dependencies` entry, and none of its options declares the dependency's key in its `properties`.
- The console used to warn `ignoring oneOf in dependencies` for that schema.

## Change

A `oneOf` under `dependencies` is a [dynamic dependency](../../json-schema/dependencies.md#dynamic) only when at least one of its options declares the dependency's key in its `properties`: the option whose `properties[key]` the data satisfies is merged in, as before.

A list where no option declares the key used to be dropped with the warning, though the validator still enforced it. It now applies as a `oneOf` beside `dependencies` does: the option the data matches is merged in, with no option selector, and `getDefaultFormState()` fills it the same way. With

```json
{
  "type": "object",
  "default": { "x": { "a": 1 } },
  "properties": {
    "x": { "type": "object", "enum": [{ "a": 1 }, { "a": 2 }], "dependencies": { "a": { "oneOf": [{ "const": { "a": 2 } }] } } }
  }
}
```

`x` renders as one select that starts on `{ "a": 2 }` under `constAsDefaults` `always` and `skipOneOf`, as it does when the dependency is written `{ "const": { "a": 2 } }`, and keeps `{ "a": 1 }` under `never` ([#5407](https://github.com/rjsf-team/react-jsonschema-form/issues/5407)).

Check that the merged option's fields and defaults are what you want. Removing the list brings back the old rendering, but also drops the constraint the validator enforced.

## Verify

- The console no longer warns `ignoring oneOf in dependencies`.
- The form renders and fills the fields of the option the data matches.
