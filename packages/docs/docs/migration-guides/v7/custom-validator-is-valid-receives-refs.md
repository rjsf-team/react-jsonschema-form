---
title: A ValidatorType of your own is handed $refs into the root schema and has to resolve them
description: '`isValid()` used to receive a copy of each condition or option, and now receives a `$ref` such as `{ $ref: ''#/if'' }` into the `rootSchema` passed beside it. Resolve that `$ref` against `rootSchema`, as `rootSchemaIdOf()` and `withRootIdRefPrefix()` do.'
packages: ['@rjsf/utils']
uses: [custom-validator]
schema: []
kind: runtime
noticed: review
---

## Detect

- In your code: a class or object implementing `ValidatorType` with an `isValid(schema, formData, rootSchema)` method, or code wrapping or logging the schema an `isValid()` call receives.
- At runtime: `isValid()` receives `{ $ref: '#/<pointer>' }`, such as `{ $ref: '#/if' }`. A validator that ignores `rootSchema` fails every condition and option, so an `if`/`then` never applies and options never match.

## Change

The form checks a condition or an option by handing the validator a `$ref` to where it sits in the root schema, in place of a copy of it. The `rootSchema` passed beside it is what the `$ref` resolves against, so a subschema means what JSON Schema says it means wherever the form reads it.

`isValid(schema, formData, rootSchema)` is handed `{ $ref: '#/<pointer>' }` for each `if` a field's resolution checks, the property an `anyOf`/`oneOf` option names as its discriminator, an option scoring has no `required` to drop from, the option `MultiSchemaField` keeps after a parent declines a switch, and, inside `{ type: 'object', properties: { <key>: { $ref } } }`, the property a dependency's `oneOf` option is matched on. A property an option declares more than once where it applies whatever the data, as `allOf: [{ $ref: Base }, { properties: { petType: { const: 'cat' } } }]` does when `Base` declares `petType` too, is handed as an `allOf` of a `$ref` to each declaration.

With this schema, `retrieveSchema()` for the data `{ a: 'x' }` makes one call:

```ts
const schema: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string' } },
  if: { properties: { a: { const: 'x' } }, required: ['a'] },
  then: { properties: { extra: { type: 'string' } } },
};
// before: isValid({ properties: { a: { const: 'x' } }, required: ['a'] }, { a: 'x' }, schema)
// after:  isValid({ $ref: '#/if' }, { a: 'x' }, schema)
```

Resolve the `$ref` against `rootSchema`. `@rjsf/validator-ajv8`, `@rjsf/validator-ata` and `@rjsf/validator-cfworker` register the root under its `$id` less any fragment, or under `ROOT_SCHEMA_PREFIX` when that leaves nothing, as `rootSchemaIdOf(rootSchema)` returns it, and prefix a local `$ref` with that id through `withRootIdRefPrefix(schema, rootSchema)`. A validator built on a JSON Schema engine can do the same:

```ts
import { rootSchemaIdOf, withRootIdRefPrefix } from '@rjsf/utils';

isValid(schema, formData, rootSchema) {
  // register `rootSchema` with your engine under rootSchemaIdOf(rootSchema), then:
  return engine.validate(withRootIdRefPrefix(schema, rootSchema), formData);
}
```

`@rjsf/validator-ajv8` uses the id as its `uriResolver` normalizes it, `http://example.com/a%20b.json` for `http://example.com/a b.json` and `http://example.com/a.json` for `http://example.com:80/a.json`, which is what Ajv looks a `$ref` up by. An Ajv-based validator of your own needs the same normalization.

## Verify

- An `if`/`then` in your schema applies when the data matches it, and options are selected for matching data.
- A test of `isValid({ $ref: '#/if' }, data, rootSchema)` returns `true` for data the `if` accepts.
