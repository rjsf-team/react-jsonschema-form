---
title: SchemaUtilsType gains canExpand and allowsAdditionalProperties
description: '`SchemaUtilsType` has two new methods, `canExpand(schema, uiSchema, formData)` and `allowsAdditionalProperties(schema)`. Add them to any `SchemaUtilsType` you write yourself rather than get from `createSchemaUtils()`.'
packages: ['@rjsf/utils']
uses: [typescript, utils-api]
schema: []
affects: [code]
related: [object-field-template-calls-schema-utils-can-expand]
---

## Detect

- Your code has a class or object typed as `SchemaUtilsType` that you wrote yourself, rather than one `createSchemaUtils()` returns.
- The type checker reports `Type 'MySchemaUtils' is missing the following properties from type 'SchemaUtilsType<...>': allowsAdditionalProperties, canExpand` (the exact list and type arguments depend on your code).

## Change

Add both methods. They answer with the form's own `SchemaContext`, which now carries the `additionalPropertiesWhenAbsent` setting, so delegate to an instance from `createSchemaUtils()` if you can:

```diff
 class MySchemaUtils implements SchemaUtilsType {
+  canExpand(schema, uiSchema, formData) {
+    return this.inner.canExpand(schema, uiSchema, formData);
+  }
+  allowsAdditionalProperties(schema) {
+    return this.inner.allowsAdditionalProperties(schema);
+  }
 }
```

## Verify

- Your implementation compiles.
- Templates that call `registry.schemaUtils.canExpand()`, as every theme's `ObjectFieldTemplate` now does, show their Add button where you expect; see [A custom ObjectFieldTemplate calls registry.schemaUtils.canExpand](./object-field-template-calls-schema-utils-can-expand.md).
