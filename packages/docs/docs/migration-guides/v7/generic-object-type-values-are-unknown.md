---
title: GenericObjectType holds unknown values
description: '`GenericObjectType` was `Record<string, any>` and is now `Record<string, unknown>`, and `mergeObjects()` and `mergeSchemas()` take any objects. Read schemas through `isSchemaObject()`, cast a merge result to `S`, and spread an `interface` value.'
packages: ['@rjsf/utils']
uses: [typescript, utils-api]
schema: []
affects: [code]
related: [rjsf-schema-has-no-index-signature, generic-symbol-object-type-removed, merge-objects-requires-object-first-argument]
---

## Detect

- In your code: values read from a `GenericObjectType`, or from a value `isObject()` narrows, used as a specific type.
- In your code: the result of `mergeObjects()` or `mergeSchemas()` assigned to `S` in a function generic over `S`.
- In your code: a value of an `interface` type put where a `GenericObjectType` is expected, such as `@rjsf/mui`'s `mui` option, or `@rjsf/core`'s `GridProps` and `LayoutGridSchemaType`, which build on it.
- The type checker reports TS18046 (`… is of type 'unknown'`), or TS2322 (`… is not assignable to type …`) for the merge result or the interface value.

## Change

`GenericObjectType` was `Record<string, any>` and is now `Record<string, unknown>`. A value `isObject()` narrows has `unknown` values, so read a schema through `isSchemaObject()` instead. `mergeObjects()` and `mergeSchemas()` take any objects and return `GenericObjectType`, so in a function generic over `S`, cast what they return to `S`:

```diff
-if (isObject(schema)) { const { properties } = schema; … }
+if (isSchemaObject(schema)) { const { properties } = schema; … }
-const merged: S = mergeSchemas(a, b);
+const merged = mergeSchemas(a, b) as S;
```

Their first argument must be an object, see [mergeObjects and mergeSchemas throw when the first argument is null or undefined](./merge-objects-requires-object-first-argument.md).

A value of an `interface` type no longer fits a `GenericObjectType`, such as the `mui` option, since an interface has no implicit index signature. Spread it, or declare its type with `type`:

```diff
-const uiSchema: UiSchema = { 'ui:options': { mui: slotProps } };
+const uiSchema: UiSchema = { 'ui:options': { mui: { ...slotProps } } };
```

`GenericSymbolObjectType` is gone, see [The GenericSymbolObjectType type is removed](./generic-symbol-object-type-removed.md).

## Verify

- The type checker accepts your reads, merges and option values.
- Nothing changes at runtime.
