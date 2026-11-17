---
title: A dependencies anyOf merges the matching option and shows no selector
description: An `anyOf` directly under a `dependencies` entry used to stay on the field with an option selector, and now merges the option the data matches with no selector. To keep the selector, wrap the `anyOf` in an `allOf` member of the entry.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [any-of-one-of, defaults]
kind: runtime
noticed: review
related: [dependency-oneof-without-key-now-applies]
---

## Detect

- Your schema has an `anyOf` directly under a `dependencies` entry.
- On the rendered page: the option selector for it is gone, and fields only another option declares don't render.

## Change

An `anyOf` under `dependencies` is merged as an `anyOf` beside `dependencies` is: the option the data matches is merged in, where the list used to stay on the field and render an option selector. An option that declares the dependency's key is merged less that property, as the option of a dynamic dependency is, so the key's own field keeps every value it offers and changing it brings in the option the new value matches. With no selector, the form offers no way to reach an option the data doesn't match: where none matches, the first is merged, so the fields only another option declares don't render until the data matches it.

This applies only to the `dependencies` entry's own `anyOf` and `oneOf`. An `anyOf` that an `allOf` member or a `then`/`else` of the entry holds still renders an option selector, and a `oneOf` there is still read as part of the dynamic dependency. So to let the user pick the option, wrap the `anyOf` in an `allOf` member of the entry, which keeps the selector, keeps the options' properties beside the key's in the data, and still applies only when the key has a value:

```json
{
  "type": "object",
  "properties": { "a": { "type": "string" } },
  "dependencies": {
    "a": {
      "allOf": [
        {
          "anyOf": [
            { "title": "With B", "properties": { "b": { "type": "string" } } },
            { "title": "With C", "properties": { "c": { "type": "number" } } }
          ]
        }
      ]
    }
  }
}
```

Or make each option declare the dependency's key, so the key's value picks it.

## Verify

- With the `allOf` wrapper, the option selector renders once the key has a value.
- With options that declare the key, changing the key's value brings in the matching option.
