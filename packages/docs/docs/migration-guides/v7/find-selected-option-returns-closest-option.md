---
title: findSelectedOptionInXxxOf returns the closest option when the options have no discriminator
description: For options with no discriminator, `findSelectedOptionInXxxOf()` used to return `undefined` unless the data held a declared `default` or `const`, and now returns the closest matching option. Check that option for what you want, or name a `discriminator`.
packages: ['@rjsf/utils']
uses: [utils-api]
schema: [any-of-one-of]
kind: runtime
noticed: review
related: [schema-functions-take-schema-context]
---

## Detect

- Your code calls `schemaUtils.findSelectedOptionInXxxOf()` (or the standalone `findSelectedOptionInXxxOf()`) on `anyOf`/`oneOf` options that declare no `discriminator`.
- That code treats an `undefined` result as "no option is selected".

## Change

`findSelectedOptionInXxxOf()` returned `undefined` for options with no discriminator unless the data held the value of a `default` or `const` one of them declared ([#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392)). It now returns the option `getClosestMatchingOption()` picks for the data, as `MultiSchemaField` does, and no longer reads `fallbackField`. With no data that is the first option. A tie goes to the first option the data matches, or to the first option when it matches none.

Code that read `undefined` as "no option is selected" now gets an option, so look for what you want in that option:

```diff
 const option = schemaUtils.findSelectedOptionInXxxOf(schema, 'a', 'anyOf', formData);
-if (option) {
+if (option?.properties?.a) {
```

Options told apart by the value of a property should name that property as their `discriminator`, the only property read by value now.

The standalone function's signature also changed; see [@rjsf/utils schema functions take a SchemaContext in place of the validator](./schema-functions-take-schema-context.md).

## Verify

- Options with a `discriminator` read as before, so a value none of them holds still selects nothing.
- Your code takes the branch you expect for empty data, which now yields the first option.
