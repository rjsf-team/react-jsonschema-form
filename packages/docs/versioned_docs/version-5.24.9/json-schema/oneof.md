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

When `allOf` is specified in a schema, react-jsonschema-form uses the [json-schema-merge-allof](https://github.com/mokkabonna/json-schema-merge-allof) library to merge the specified subschemas to create a combined subschema that is valid. For example, the below schema evaluates to a combined subschema of `{type: "boolean"}`:

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
