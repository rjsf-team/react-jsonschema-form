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

A field with a `oneOf` or `anyOf` of its own beside one in an `allOf` entry, or in the `then` or `else` that applies, offers each of its own options merged with each of the other list's, since the data has to match both.
A `then` or `else` option's keywords win over the field's option it is merged with, as the `then` or `else` wins over the field. A pair whose options name different `$ref`s, or `type`s no value meets both of, is left out, and where every pair is, the `then` or `else` list replaces the field's own, as it does under a `customMergeAllOf`.
An entry of `uiSchema.oneOf` or `uiSchema.anyOf` describes the field's own option at its index, so each merged option takes the entry of the field's option it was built from.
A field whose lists sit only in `allOf` entries has no list of its own for the entries to describe, so each entry describes the merged option at its position.
Each merged option is labelled with the names of the options it was built from, as "B, C": the field's own option by its entry's `ui:title`, or else its `title`, and the other by its `title`.
