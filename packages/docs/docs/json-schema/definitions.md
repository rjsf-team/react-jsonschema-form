# Schema definitions and references

This library partially supports [inline schema definition dereferencing](http://json-schema.org/draft/2019-09/json-schema-core.html#ref), which allows you to re-use parts of your schema:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  definitions: {
    address: {
      type: 'object',
      properties: {
        street_address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
      },
      required: ['street_address', 'city', 'state'],
    },
  },
  type: 'object',
  properties: {
    billing_address: { $ref: '#/definitions/address' },
    shipping_address: { $ref: '#/definitions/address' },
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

Note that this library only supports local definition referencing. The value in the `$ref` keyword should be a [JSON Pointer](https://tools.ietf.org/html/rfc6901) in URI fragment identifier format.

## uiSchema for Schema Definitions

To customize the UI for schemas referenced via `$ref`, use the `ui:definitions` property in your uiSchema. This works for both reused and recursive schemas.

See [ui:definitions](../api-reference/uiSchema.md#uidefinitions) for full details and more examples.

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  definitions: {
    node: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        children: {
          type: 'array',
          items: { $ref: '#/definitions/node' },
        },
      },
    },
  },
  type: 'object',
  properties: {
    tree: { $ref: '#/definitions/node' },
  },
};

const uiSchema: UiSchema = {
  'ui:definitions': {
    '#/definitions/node': {
      name: { 'ui:placeholder': 'Node name' },
    },
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```
