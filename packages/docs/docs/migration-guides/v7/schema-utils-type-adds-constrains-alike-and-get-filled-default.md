---
title: SchemaUtilsType gains constrainsAlike(), childFillOf(), getFieldDefault() and getFilledDefault()
description: "`SchemaUtilsType` has four new required methods and `doesSchemaUtilsDiffer()` takes a `SchemaContext`. An implementation of your own, such as a class or a hand-built mock, must add them."
packages: ['@rjsf/utils']
uses: [typescript, utils-api]
schema: []
affects: [code]
related: [schema-functions-take-schema-context]
---

## Detect

- In your code, a class or object that implements `SchemaUtilsType` from `@rjsf/utils`, such as a test mock.
- The type checker reports `Type '{ … }' is missing the following properties from type 'SchemaUtilsType<…>': constrainsAlike, childFillOf, getFilledDefault, getFieldDefault` (TS2739) on it, or `Property 'getFieldDefault' is missing in type '{ … }' but required in type 'SchemaUtilsType<…>'.` (TS2741) when only one is missing.

## Change

`SchemaUtilsType` gains four methods, which read a field's defaults under the form's own `defaultFormStateBehavior` from a `FieldFill`, what the defaults hand the field:

- `constrainsAlike(oldSchema, newSchema, oldFill, newFill)`
- `childFillOf(schema, fill, key)`
- `getFieldDefault(schema, fill)`
- `getFilledDefault(schema, fill)`

Its `doesSchemaUtilsDiffer()` takes a [`SchemaContext`](./schema-functions-take-schema-context.md) and the `rootSchema`: `doesSchemaUtilsDiffer(context, rootSchema)`.

Add the four methods to your implementation. The simplest way is to delegate to an instance from `createSchemaUtils()`:

```diff
+const real = createSchemaUtils(context, rootSchema);
 const schemaUtils: SchemaUtilsType = {
   ...
+  constrainsAlike: real.constrainsAlike.bind(real),
+  childFillOf: real.childFillOf.bind(real),
+  getFieldDefault: real.getFieldDefault.bind(real),
+  getFilledDefault: real.getFilledDefault.bind(real),
 };
```

## Verify

The type checker accepts your implementation.
