---
title: RJSFMarkedSchema has no index signature and its markers are unknown
description: "`RJSFMarkedSchema` lost its index signature, and its marker values are now `unknown`. Declare your own keywords on `JSONSchema7`, read flags with `hasSchemaMarker()` and narrow other markers before use."
packages: ['@rjsf/utils']
uses: [typescript, utils-api]
schema: []
kind: type
noticed: type-error
related: [additional-property-flag-counts-only-when-truthy, rjsf-schema-custom-keywords-need-augmentation]
---

## Detect

- The type checker reports `TS7053: Element implicitly has an 'any' type because expression of type '"x-custom"' can't be used to index type 'RJSFMarkedSchema'` where your code indexes an `RJSFMarkedSchema` with a key it doesn't declare, such as `marked['x-custom']`.
- The type checker reports `TS2322: Type 'unknown' is not assignable to type 'string | boolean'` where your code reads a marker into a typed variable, such as `const added: boolean | string = marked[ADDITIONAL_PROPERTY_FLAG]`.

## Change

A keyword of `JSONSchema7`, or one of the later-draft, OpenAPI and Ajv keywords `@rjsf/utils` declares, such as `marked.$defs`, still reads with its type. For a keyword of your own, such as `marked['x-custom']`, declare it on `JSONSchema7` by module augmentation, as [custom keywords need augmentation](./rjsf-schema-custom-keywords-need-augmentation.md) shows for `RJSFSchema`.

A marker's value is `unknown`. Read a flag marker with [`hasSchemaMarker()`](../../api-reference/utility-functions.md#hasschemamarker), which also returns `false` for a boolean subschema:

```diff
-const added: boolean | string = marked[ADDITIONAL_PROPERTY_FLAG];
+const added = hasSchemaMarker(marked, ADDITIONAL_PROPERTY_FLAG);
```

`hasSchemaMarker()` takes only the markers that hold a flag, and says whether one is set. Read the value of any other marker, such as the `$ref` that `RJSF_REF_KEY` holds, by indexing an `RJSFMarkedSchema`: `marked[RJSF_REF_KEY]` is `unknown`, so narrow it before use. On a schema of another type, `Reflect.get(schema, RJSF_REF_KEY)` behind an object check returns `any`, since the type doesn't declare the key, so give the result the type `unknown`. Write a marker with `Reflect.set()`.

## Verify

- The type checker reports no TS7053 or TS2322 on your marker and keyword reads.
- Flag reads behave as described in [ADDITIONAL_PROPERTY_FLAG counts only when truthy](./additional-property-flag-counts-only-when-truthy.md).
