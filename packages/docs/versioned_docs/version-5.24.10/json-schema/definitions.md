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
