# Schema definitions and references

This library partially supports [inline schema definition dereferencing](http://json-schema.org/draft/2019-09/json-schema-core.html#ref), which is Barbarian for *avoiding to copy and paste commonly used field schemas*:

```jsx
const schema = {
  "definitions": {
    "address": {
      "type": "object",
      "properties": {
        "street_address": { "type": "string" },
        "city":           { "type": "string" },
        "state":          { "type": "string" }
      },
      "required": ["street_address", "city", "state"]
    }
  },
  "type": "object",
  "properties": {
    "billing_address": { "$ref": "#/definitions/address" },
    "shipping_address": { "$ref": "#/definitions/address" }
  }
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

Note that this library only supports local definition referencing. The value in the `$ref` keyword should be a [JSON Pointer](https://tools.ietf.org/html/rfc6901) in URI fragment identifier format.
