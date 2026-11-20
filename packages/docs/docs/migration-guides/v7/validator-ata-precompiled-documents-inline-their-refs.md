---
title: The ata validator compiles each precompiled schema as a document carrying what it references
description: '`@rjsf/validator-ata` now precompiles each schema as a document that inlines every root subschema it references, so a `$ref` into another document throws `was not compiled to a standalone validator`. Bundle such `$ref`s into the root before precompiling.'
packages: ['@rjsf/validator-ata']
uses: [custom-validator]
schema: [refs]
affects: [code, setup, data]
related: [precompiled-validator-code-must-be-regenerated]
---

## Detect

- In your build: `compileSchemaValidators(` or `compileSchemaValidatorsCode(` from `@rjsf/validator-ata`.
- In your schema: a `$ref` into another document, a `$ref` that names nothing in the root, a `$ref` to a property or the root such as `'#/properties/tree'`, a percent-encoded `$ref` such as `#/definitions/c%20d`, a `$ref` beside keywords that assert something, or a schema holding only annotations such as `{ title: 'Anything' }`.
- Thrown error at validation: `was not compiled to a standalone validator`.

## Change

`@rjsf/validator-ata` compiles each schema as a document of its own, and `ata-validator` resolves a `$ref` only to an entry of the `definitions` or `$defs` in it. So each document carries what it reaches of the root: every subschema of the root it names through a `$ref`, such as a definition, a property, an option or the root itself, as an entry of its own in one container, the `$ref` renamed to it. That is needed because `ata-validator` compiles nothing for a document holding both `definitions` and `$defs`, and does not percent-decode a `$ref` such as `#/definitions/c%20d`. A `$ref` beside other keywords is compiled as an `allOf` entry beside them, as 2019-09, 2020-12 and Ajv read it, since `ata-validator` compiles no `$ref` beside keywords that assert something.

- A property that refers back to itself, `tree: { type: 'object', properties: { name: { type: 'string' }, kids: { type: 'array', items: { $ref: '#/properties/tree' } } } }`, now validates, reporting `.tree.kids.0.kids.0.name` for `{ tree: { kids: [{ kids: [{ name: 5 }] }] } }`, where 6.11.0 overflowed the stack.
- A `$ref` that names nothing in the root, or one into another document, leaves `ata-validator` nothing to compile, which throws `was not compiled to a standalone validator` when the form validates against it.
- `ata-validator` compiles no function for a schema holding only annotations either, so each schema without a `not` or a `$ref` is compiled with `not: { not: {} }`, which always holds. A precompiled validator for the root `{ title: 'Anything' }` returns `true` from `isValid()` where it threw `was not compiled to a standalone validator`.

Bundle any `$ref` into another document into the root before precompiling, and fix any `$ref` that names nothing in the root. Then regenerate the code; see [Precompiled validator code must be regenerated](./precompiled-validator-code-must-be-regenerated.md).

## Verify

- The regenerated validator validates the form without `was not compiled to a standalone validator`.
- Errors for a recursive property name its path, such as `.tree.kids.0.kids.0.name`.
- An annotation-only root validates as `true`.
