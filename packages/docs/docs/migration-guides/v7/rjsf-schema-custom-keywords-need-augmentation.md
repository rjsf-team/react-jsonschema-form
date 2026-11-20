---
title: Schema keywords of your own are declared by augmenting JSONSchema7
description: '`RJSFSchema` was `JSONSchema7 & Record<string, any>` and is now `JSONSchema7` augmented with the keywords RJSF reads, so other keywords fail to type-check. Declare yours by augmenting `JSONSchema7` in `declare module ''json-schema''`.'
packages: ['@rjsf/utils']
uses: [typescript]
schema: []
affects: [code]
related: [rjsf-schema-has-no-index-signature, rjsf-marked-schema-has-no-index-signature]
---

## Detect

- In your code: a schema typed `RJSFSchema` that uses a keyword draft 7 lacks and RJSF doesn't declare, such as `x-group`.
- In your code: a `discriminator` with a field other than `propertyName` and `mapping`, such as `defaultMapping`.
- In your code: an existing `declare module 'json-schema'` that augments `JSONSchema7` with one of the keywords listed below.
- The type checker reports TS2353 (`Object literal may only specify known properties`) on the keyword, or an error on your augmentation saying the property's declarations must have the same type.

## Change

`RJSFSchema` is `JSONSchema7`, which `@rjsf/utils` augments with the keywords RJSF or its validators read beyond draft 7: `$anchor`, `$dynamicAnchor`, `$dynamicRef`, `$recursiveAnchor`, `$recursiveRef`, `$vocabulary`, `contentSchema`, `dependentRequired`, `dependentSchemas`, `minContains`, `maxContains`, `prefixItems`, `unevaluatedItems` and `unevaluatedProperties` from later drafts, OpenAPI's `discriminator` and `components`, Ajv's `nullable`, `formatMinimum`, `formatMaximum`, `formatExclusiveMinimum` and `formatExclusiveMaximum`, and ajv-errors' `errorMessage`. A schema with keywords of its own declares them the same way, so they type-check at every depth, a property's subschema included:

```diff
-const schema: RJSFSchema = { type: 'object', 'x-group': 'contact' };
+declare module 'json-schema' {
+  interface JSONSchema7 {
+    'x-group'?: string;
+  }
+}
+const schema: RJSFSchema = {
+  type: 'object',
+  'x-group': 'contact',
+  properties: { phone: { type: 'string', 'x-group': 'contact' } },
+};
```

If the `declare module` fails with TS2664, your project needs `@types/json-schema` of its own. If `type` and every other keyword then fail with TS2353, the file holding it needs an `import` or `export`. See [Keywords of your own](../../advanced-customization/typescript.md#keywords-of-your-own).

A type of your own, such as `RJSFSchema & { 'x-group'?: string }`, which `Form` infers as `S` or takes as its second type argument, declares a keyword on the root schema alone, since a subschema is a `JSONSchema7Definition`.

Since the augmentation is global, code that already augments `JSONSchema7` with one of the keywords above under another type no longer compiles: the checker reports that later declarations of that property must have the same type. Declare it with the type `@rjsf/utils` gives it.

OpenAPI's `discriminator` is the interface `JSONSchema7Discriminator`, which declares `propertyName` and `mapping`. A field of its own, such as `defaultMapping`, now fails with TS2353, so declare it by augmenting that interface:

```ts
declare module 'json-schema' {
  interface JSONSchema7Discriminator {
    defaultMapping?: string;
  }
}
```

The same augmentation types your keywords on an `RJSFMarkedSchema`, see [RJSFMarkedSchema has no index signature](./rjsf-marked-schema-has-no-index-signature.md). Indexing a schema with a `string` key is covered in [RJSFSchema has no index signature](./rjsf-schema-has-no-index-signature.md).

## Verify

- The type checker accepts your schemas, including your keywords inside subschemas.
- Nothing changes at runtime: the validators see the same schema.
