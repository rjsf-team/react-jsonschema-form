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

*(Sample schema courtesy of the [Space Telescope Science Institute](http://spacetelescope.github.io/understanding-json-schema/structuring.html))*

Note that it only supports local definition referencing; we do not plan on fetching foreign schemas over HTTP anytime soon. Basically, you can only reference a definition from the very schema object defining it.

