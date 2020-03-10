## Property dependencies

This library supports conditionally making fields required based on the presence of other fields.

### Unidirectional

In the following example the `billing_address` field will be required if `credit_card` is defined.

```json
{
  "type": "object",

  "properties": {
    "name": { "type": "string" },
    "credit_card": { "type": "number" },
    "billing_address": { "type": "string" }
  },

  "required": ["name"],

  "dependencies": {
    "credit_card": ["billing_address"]
  }
}
```

### Bidirectional

In the following example the `billing_address` field will be required if `credit_card` is defined and the `credit_card`
field will be required if `billing_address` is defined making them both required if either is defined.

```json
{
  "type": "object",

  "properties": {
    "name": { "type": "string" },
    "credit_card": { "type": "number" },
    "billing_address": { "type": "string" }
  },

  "required": ["name"],

  "dependencies": {
    "credit_card": ["billing_address"],
    "billing_address": ["credit_card"]
  }
}
```

*(Sample schemas courtesy of the [Space Telescope Science Institute](https://spacetelescope.github.io/understanding-json-schema/reference/object.html#property-dependencies))*

## Schema dependencies

This library also supports modifying portions of a schema based on form data.

### Conditional

```json
{
  "type": "object",

  "properties": {
    "name": { "type": "string" },
    "credit_card": { "type": "number" }
  },

  "required": ["name"],

  "dependencies": {
    "credit_card": {
      "properties": {
        "billing_address": { "type": "string" }
      },
      "required": ["billing_address"]
    }
  }
}
```

In this example the `billing_address` field will be displayed in the form if `credit_card` is defined.

*(Sample schemas courtesy of the [Space Telescope Science Institute](https://spacetelescope.github.io/understanding-json-schema/reference/object.html#schema-dependencies))*

### Dynamic

The JSON Schema standard says that the dependency is triggered if the property is present. However, sometimes it's useful to have more sophisticated rules guiding the application of the dependency. For example, maybe you have three possible values for a field, and each one should lead to adding a different question. For this, we support a very restricted use of the `oneOf` keyword.

```json
{
  "title": "Person",
  "type": "object",
  "properties": {
    "Do you have any pets?": {
      "type": "string",
      "enum": [
        "No",
        "Yes: One",
        "Yes: More than one"
      ],
      "default": "No"
    }
  },
  "required": [
    "Do you have any pets?"
  ],
  "dependencies": {
    "Do you have any pets?": {
      "oneOf": [
        {
          "properties": {
            "Do you have any pets?": {
              "enum": [
                "No"
              ]
            }
          }
        },
        {
          "properties": {
            "Do you have any pets?": {
              "enum": [
                "Yes: One"
              ]
            },
            "How old is your pet?": {
              "type": "number"
            }
          },
          "required": [
            "How old is your pet?"
          ]
        },
        {
          "properties": {
            "Do you have any pets?": {
              "enum": [
                "Yes: More than one"
              ]
            },
            "Do you want to get rid of any?": {
              "type": "boolean"
            }
          },
          "required": [
            "Do you want to get rid of any?"
          ]
        }
      ]
    }
  }
}
```

In this example the user is prompted with different follow-up questions dynamically based on their answer to the first question.

In these examples, the "Do you have any pets?" question is validated against the corresponding property in each schema in the `oneOf` array. If exactly one matches, the rest of that schema is merged with the existing schema.
