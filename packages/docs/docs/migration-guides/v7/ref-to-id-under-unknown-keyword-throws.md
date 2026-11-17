---
title: An $id under an unknown keyword such as components or x- keys no longer names a schema
description: An `$id` under a container RJSF doesn't walk, such as `components` or an `x-*` key, used to be found as an embedded schema and is now plain data, so a `$ref` to it throws. Move those schemas under `$defs` or `definitions`.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [refs]
kind: runtime
noticed: runtime-error
related: []
---

## Detect

- Your schema declares an `$id` inside a container that is not a schema keyword, such as an OpenAPI-style `components` block or an `x-*` vendor key.
- A `$ref` somewhere in the schema points at that `$id`.
- The form throws `Could not find a definition for ...` when it renders, though validation passes.

## Change

Embedded schemas are found by `$id` through the schema's structure: only the keywords that hold a schema, an array of schemas or a map of names to schemas are walked. Under any other container an `$id` is data. It is no longer found as an embedded schema, and it no longer changes what the `$ref`s beside and below it resolve against, also where a `$ref` reaches the schema holding it.

Move those schemas under `$defs` (draft 2020-12) or `definitions` (draft 7) so the walk reaches them:

```diff
 {
   "$id": "https://e.com/root.json",
-  "components": {
-    "Pet": { "$id": "pet.json", "type": "object" }
-  },
+  "$defs": {
+    "Pet": { "$id": "pet.json", "type": "object" }
+  },
   "properties": { "pet": { "$ref": "pet.json" } }
 }
```

## Verify

- The form renders without `Could not find a definition for ...`.
- The usual OpenAPI layout, with `components` at the root and `#/components/...` refs, keeps working: a schema such a `$ref` reaches is still read as a schema, and its own `$ref`s resolve against the resource holding the container.
- AJV collects `$id`s by walking every key, so it still finds an `$id` kept under `components` or `x-*`. A passing validation run does not show the schema renders.
