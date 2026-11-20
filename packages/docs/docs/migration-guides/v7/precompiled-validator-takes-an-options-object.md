---
title: createPrecompiledValidator() takes its localizer and suppressDuplicateFiltering in an options object
description: "`createPrecompiledValidator()` used to take `localizer` and `suppressDuplicateFiltering` as its third and fourth arguments. Pass them in an options object as the third argument instead, and drop a leftover data type argument."
packages: ['@rjsf/validator-ajv8', '@rjsf/validator-ata']
uses: [custom-validator]
schema: []
affects: [code]
related: [precompiled-validator-returns-its-class, localizer-gets-quoted-property-names, schema-functions-take-schema-context, validator-type-takes-schema-type-first]
---

## Detect

- Your code calls `createPrecompiledValidator()` from `@rjsf/validator-ajv8` or `@rjsf/validator-ata` with a `localizer` or `suppressDuplicateFiltering` as its third or fourth argument, including `createPrecompiledValidator(validateFns, schema, undefined, 'all')`.
- Your code passes a data type argument, such as `createPrecompiledValidator<MyData>()`.
- The type checker reports `TS2554: Expected 2-3 arguments, but got 4` for a fourth argument, or `TS2559: Type '(e: any) => void' has no properties in common with type 'PrecompiledValidatorOptionsType<JSONSchema7>'` for a `localizer` passed as the third.
- In untyped code that still passes them positionally, nothing reports it: a `localizer` third stops localizing, and a fourth argument is ignored. A `null` third throws a `TypeError`.

## Change

The third argument is now an options object holding `localizer`, `suppressDuplicateFiltering` and `customMergeAllOf`, and there is no fourth. Drop a leftover data type argument too, since the first type argument is now the schema type, as [ValidatorType and customizeValidator take the schema type first](./validator-type-takes-schema-type-first.md) describes:

```diff
-const validator = createPrecompiledValidator<MyData>(validateFns, schema, localize, suppressDuplicateFiltering);
+const validator = createPrecompiledValidator(validateFns, schema, { localizer: localize, suppressDuplicateFiltering });
```

For `customMergeAllOf`, see [schema functions take a SchemaContext](./schema-functions-take-schema-context.md). For every option, see `createPrecompiledValidator()` in the [`@rjsf/validator-ajv8`](../../api-reference/validator-ajv8.md#createprecompiledvalidators-extends-strictrjsfschema--rjsfschema-f-extends-formcontexttype--formcontexttype) and [`@rjsf/validator-ata`](../../api-reference/validator-ata.md#createprecompiledvalidators-extends-strictrjsfschema--rjsfschema-f-extends-formcontexttype--formcontexttype) references.

## Verify

- Localized error messages still appear, now with quoted property names as [a localizer gets quoted property names](./localizer-gets-quoted-property-names.md) describes.
- Duplicate filtering behaves as before.
