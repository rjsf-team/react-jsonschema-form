# oneOf, anyOf, and allOf

react-jsonschema-form supports custom widgets for oneOf, anyOf, and allOf.

- A schema with `oneOf` is valid if _exactly one_ of the subschemas is valid.
- A schema with `anyOf` is valid if _at least one_ of the subschemas is valid.
- A schema with `allOf` is valid if _all_ of the subschemas are valid.

## oneOf

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  oneOf: [
    {
      properties: {
        lorem: {
          type: 'string',
        },
      },
      required: ['lorem'],
    },
    {
      properties: {
        ipsum: {
          type: 'string',
        },
      },
      required: ['ipsum'],
    },
  ],
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

## anyOf

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  anyOf: [
    {
      properties: {
        lorem: {
          type: 'string',
        },
      },
      required: ['lorem'],
    },
    {
      properties: {
        lorem: {
          type: 'string',
        },
        ipsum: {
          type: 'string',
        },
      },
    },
  ],
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

## allOf

When `allOf` is specified in a schema, react-jsonschema-form uses the [@x0k/json-schema-merge](https://github.com/x0k/json-schema-merge/) library to merge the specified subschemas to create a combined subschema that is valid. For example, the below schema evaluates to a combined subschema of `{type: "boolean"}`:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  title: 'Field',
  allOf: [
    {
      type: ['string', 'boolean'],
    },
    {
      type: 'boolean',
    },
  ],
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

A field with a `oneOf` or `anyOf` of its own beside one in an `allOf` entry, or in the `then` or `else` written on the field that applies, offers each of its own options merged with each of the other list's, since the data has to match both.
Each pair keeps the constraints of both options, and a `then` or `else` option's `title`, `description`, `default` and other annotations win over those of the field's option. A pair whose options name different `$ref`s or `const`s, a `const` the other's `enum` leaves out, or `type`s no value meets both of, is left out, and where every pair is, the `then` or `else` list replaces the field's own, as it does under a `customMergeAllOf`.
A `then` or `else` on the parent object that declares the property's list, as `then: { properties: { p: { oneOf: [...] } } }` does, replaces the property's own list rather than merging with it.
An entry of `uiSchema.oneOf` or `uiSchema.anyOf` describes the field's own option at its index, so each merged option takes the entry of the field's option it was built from.
A field whose lists sit only in `allOf` entries has no list of its own for the entries to describe, so each entry describes the merged option at its position.
Each merged option is labelled with the names of the options it was built from, as "B, C": the field's own option by its entry's `ui:title`, or else its `title`, and the other by its `title`, an option written as a `$ref` taking its definition's `title` where none is written beside it.
