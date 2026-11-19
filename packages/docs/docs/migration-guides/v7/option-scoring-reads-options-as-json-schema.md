---
title: getFirstMatchingOption and getClosestMatchingOption match an option as JSON Schema reads it
description: 'Option matching now reads an option''s `$ref`, `allOf`, `then`/`else` and `dependencies`, and drops their `required` when they declare `properties`, so existing data can select another option. Check the option your data selects and reorder options to fit.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, utils-api]
schema: [any-of-one-of, refs]
affects: [data, code]
related: [keywords-beside-a-ref-merge-as-an-allof, dependency-oneof-option-matched-through-allof, removed-option-scoring-and-root-schema-utils]
---

## Detect

- In your schema: `anyOf`/`oneOf` options that are `{ $ref: … }` or `{ allOf: [ … ] }`, or that declare `required` or properties through a `$ref`, `allOf`, `then`/`else` or `dependencies`.
- In your code: `getFirstMatchingOption(`, `getClosestMatchingOption(` or `omitExtraData(`, or a `transformChange` prop that rewrites an option switch.
- On the rendered page: a different option is selected for existing form data.

## Change

`getFirstMatchingOption()` and `getClosestMatchingOption()` match an option as JSON Schema reads it, and check in JavaScript that the data holds a key the option declares: a key named by its `properties` or `patternProperties`, or by those of its `$ref` target, its `allOf` entries, its `then`/`else` and its `dependencies` schemas. Where something in that scope declares `properties`, scoring drops every `required` in the scope, and every `dependencies` entry listing names, so a user who has yet to fill in a required key is still matched to the option. Before, it dropped only the option's own `required`, and only when the option itself declared `properties`.

An option whose scope declares no `properties`, as in the "at least one of" pattern, is matched by its `required` as before:

```ts
const rootSchema: RJSFSchema = {
  type: 'object',
  properties: { email: { type: 'string' }, phone: { type: 'string' } },
  oneOf: [{ title: 'By email', required: ['email'] }, { title: 'By phone', required: ['phone'] }],
};
getFirstMatchingOption(context, { phone: '1' }, rootSchema.oneOf, rootSchema);
// before and after: 1
```

An option written as a `$ref`, or composed with `allOf`, is now matched as one written out in place is:

```ts
const rootSchema: RJSFSchema = {
  definitions: {
    A: { type: 'object', properties: { a: { type: 'number' } } },
    B: { type: 'object', properties: { b: { type: 'number' } } },
    Base: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
};
getFirstMatchingOption(context, { b: 1 }, [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }], rootSchema);
// before: 0, the first option matching any object; after: 1
getFirstMatchingOption(
  context,
  { kind: 'x' },
  [
    { type: 'object', properties: { kind: { const: 'y' } } },
    { allOf: [{ $ref: '#/definitions/Base' }], properties: { kind: { const: 'x' } } },
  ],
  rootSchema,
);
// before: 0, since Base's `required` failed the second option; after: 1
```

`getClosestMatchingOption()` and `omitExtraData()` resolve only an option's own `$ref` and leave the ones below it to the validator. `getClosestMatchingOption()` scores a property written as a `$ref` as the definition it names, as far as the form data reaches, whether or not the `$ref` is recursive, resolving each `$ref` it follows in the resource of the declaration holding it.

Where an option's own `then` overrides a keyword when the form renders it, scoring now holds the data to both, as validating the whole form on submit already did. When `transformChange` rewrites an option switch, `MultiSchemaField` checks the data against the option it keeps, read the same way.

`getOptionMatchingSimpleDiscriminator()` and `relaxOptionsForScoring()` are removed, since option scoring no longer calls them; see [getOptionMatchingSimpleDiscriminator, isRootSchema, relaxOptionsForScoring and schemaHasNestedConditional are removed](./removed-option-scoring-and-root-schema-utils.md) for what to call instead. Keywords written beside an option's `$ref` are matched too; see [Keywords beside a $ref are merged with its target as an allOf](./keywords-beside-a-ref-merge-as-an-allof.md).

If an option order relied on the old matching to pick an earlier option, reorder the options or make each option's declared keys tell them apart.

## Verify

- Existing data selects the option that the same option written out in place would select.
- A user who has not yet filled a required key of an option's `allOf` or `$ref` target stays on that option.
