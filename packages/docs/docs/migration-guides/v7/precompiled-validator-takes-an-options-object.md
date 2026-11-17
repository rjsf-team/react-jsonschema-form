---
title: createPrecompiledValidator() takes its localizer in an options object
description: "`createPrecompiledValidator()` used to take `localizer` and `suppressDuplicateFiltering` as its third and fourth arguments. Pass them in an options object as the third argument instead."
packages: ['@rjsf/validator-ajv8', '@rjsf/validator-ata']
uses: [custom-validator]
schema: []
kind: removal
noticed: type-error
related: [precompiled-validator-returns-its-class, localizer-gets-quoted-property-names, schema-functions-take-schema-context]
---

## Detect

- Your code calls `createPrecompiledValidator()` from `@rjsf/validator-ajv8` or `@rjsf/validator-ata` with a `localizer` or `suppressDuplicateFiltering` as its third or fourth argument.
- The type checker reports `TS2554: Expected 2-3 arguments, but got 4` for a fourth argument, or `TS2559: Type '(e: any) => void' has no properties in common with type 'PrecompiledValidatorOptionsType<JSONSchema7>'` for a `localizer` passed as the third.

## Change

The third argument is now an options object holding `localizer`, `suppressDuplicateFiltering` and `customMergeAllOf`, and there is no fourth:

```diff
-const validator = createPrecompiledValidator(validateFns, schema, localize, suppressDuplicateFiltering);
+const validator = createPrecompiledValidator(validateFns, schema, { localizer: localize, suppressDuplicateFiltering });
```

For `customMergeAllOf`, see [schema functions take a SchemaContext](./schema-functions-take-schema-context.md).

## Verify

- Localized error messages still appear, now with quoted property names as [a localizer gets quoted property names](./localizer-gets-quoted-property-names.md) describes.
- Duplicate filtering behaves as before.
