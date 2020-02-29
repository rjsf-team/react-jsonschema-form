## Schema definitions and references

This library partially supports [inline schema definition dereferencing]( http://json-schema.org/latest/json-schema-core.html#rfc.section.7.2.3), which is Barbarian for *avoiding to copy and paste commonly used field schemas*:

```json
{
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
}
```

Note that this library only supports local definition referencing. The value in the `$ref` keyword should be a [JSON Pointer](https://tools.ietf.org/html/rfc6901) in URI fragment identifier format.