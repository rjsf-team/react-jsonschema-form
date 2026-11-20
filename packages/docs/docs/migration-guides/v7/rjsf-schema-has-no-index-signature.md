---
title: RJSFSchema has no index signature
description: '`RJSFSchema` no longer carries a `Record<string, any>` index signature, so string-keyed reads and objects that relied on it fail. Index with `keyof RJSFSchema`, and type maps as `Record<string, RJSFSchema>` and marked schemas as `RJSFMarkedSchema`.'
packages: ['@rjsf/utils']
uses: [typescript]
schema: []
affects: [code]
related: [rjsf-schema-custom-keywords-need-augmentation, generic-object-type-values-are-unknown]
---

## Detect

- In your code: `schema[key]` on an `RJSFSchema` where `key` is a `string`.
- In your code: an `RJSFSchema` passed where a `Record<string, unknown>` is expected.
- In your code: a `properties` or `$defs` map, or a schema carrying a marker such as `ADDITIONAL_PROPERTY_FLAG`, typed as `RJSFSchema`.
- The type checker reports TS7053 (`Element implicitly has an 'any' type because expression of type 'string' can't be used to index type …`), TS2345 for the `Record` argument, or TS2353 (`Object literal may only specify known properties`) for the map or marker.

## Change

`RJSFSchema` has no index signature any more, so `schema[key]` with a `string` key and passing a schema as a `Record<string, unknown>` are type errors. Type the key as `keyof RJSFSchema`, and the parameter as `RJSFSchema`.

An object that was only accepted through that index signature now fails with TS2353. A `properties` or `$defs` map isn't a schema itself, so type it as `Record<string, RJSFSchema>`. A schema that carries a marker such as `ADDITIONAL_PROPERTY_FLAG` is an `RJSFMarkedSchema`:

```diff
-const properties: RJSFSchema = { name: { type: 'string' } };
+const properties: Record<string, RJSFSchema> = { name: { type: 'string' } };

-const schema: RJSFSchema = { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true };
+const schema: RJSFMarkedSchema = { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true };
```

A keyword of your own that the index signature used to accept is declared by augmentation, see [Schema keywords of your own are declared by augmenting JSONSchema7](./rjsf-schema-custom-keywords-need-augmentation.md). Reading a schema out of a `GenericObjectType` is covered in [GenericObjectType holds unknown values](./generic-object-type-values-are-unknown.md).

## Verify

- The type checker accepts your schema reads, maps and marked schemas.
- Nothing changes at runtime.
