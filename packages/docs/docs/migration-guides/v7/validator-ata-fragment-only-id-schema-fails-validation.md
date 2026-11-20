---
title: An ata extra schema whose only $id is a fragment fails validation
description: "With `ata-validator` 1.64.0, an extra schema whose only `$id` is a fragment, such as `#frag`, has no `$id` to register under, so every validation fails. Remove it, give it an `$id` a `$ref` can name, or key it in an `ataOptionsOverrides.schemas` record."
packages: ['@rjsf/validator-ata']
uses: [custom-validator]
schema: [refs]
affects: [data, code]
---

## Detect

- In your code, a schema whose only `$id` is a fragment, such as `{ $id: '#frag' }`, passed in `additionalMetaSchemas` or in an `ataOptionsOverrides.schemas` array.
- Every validation fails with `Schema in schemas option must have $id` for an `ataOptionsOverrides.schemas` entry.
- Every validation fails with `Schema in additionalMetaSchemas must have an $id other than a fragment, not #frag` for an `additionalMetaSchemas` entry.
- `compileSchemaValidatorsCode()` logs a warning and leaves the schema out.

## Change

With `ata-validator` before 1.64.0, which 6.x installs could resolve, ata kept such a schema under `#frag`. No `$ref` reached it, so it changed nothing. `ata-validator` 1.64.0 reads such an `$id` as an `$anchor`. The schema then has no `$id` to be registered under, and every validation fails, as for an entry without an `$id`. A precompiled validator ignores it, since `compileSchemaValidatorsCode()` leaves it out.

Remove the entry, or give it an `$id` a `$ref` can name, or key it by one in an `ataOptionsOverrides.schemas` record:

```diff
-customizeValidator({ ataOptionsOverrides: { schemas: [{ $id: '#frag', maxLength: 2 }] } });
+customizeValidator({ ataOptionsOverrides: { schemas: { 'urn:frag': { maxLength: 2 } } } });
```

## Verify

- Validation runs again and reports only the errors your data has.
- `compileSchemaValidatorsCode()` logs no warning about the schema.
