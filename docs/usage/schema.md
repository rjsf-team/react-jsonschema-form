# JSON Schema

## Basic schema types

## Object schema types

## Object additional properties

You can define `additionalProperties` by setting its value to a schema object, such as the following:

```jsx
const schema = {
  "type": "object",
  "properties": {"type": "string"},
  "additionalProperties": {"type": "number"}
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

In this way, an add button for new properties is shown by default. The UX for editing properties whose names are user-defined is still experimental.

You can also define `uiSchema` options for `additionalProperties` by setting the `additionalProperties` attribute in the `uiSchema`.

### `expandable` option

You can turn support for `additionalProperties` off with the `expandable` option in `uiSchema`:

```js
const uiSchema = {
  "ui:options":  {
    expandable: false
  }
};
```

## `enum` fields

### Custom labels for `enum` fields

This library supports the [`enumNames`](https://github.com/json-schema/json-schema/wiki/enumNames-%28v5-proposal%29) property for `enum` fields, which allows defining custom labels for each option of an `enum`:

```jsx
const schema = {
  type: "number",
  enum: [1, 2, 3],
  enumNames: ["one", "two", "three"]
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

#### Alternative JSON-Schema compliant approach

JSON Schema has an alternative approach to enumerations; react-jsonschema-form supports it as well.

```jsx
const schema = {
  "type": "number",
  "anyOf": [
    {
      "type": "number",
      "title": "one",
      "enum": [
        1
      ]
    },
    {
      "type": "number",
      "title": "two",
      "enum": [
        2
      ]
    },
    {
      "type": "number",
      "title": "three",
      "enum": [
        3
      ]
    }
  ]
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

This also works for radio buttons:

```js
const schema = {
  "type": "boolean",
  "oneOf": [
    {
      "const": true,
      "title": "Yes"
    },
    {
      "const": false,
      "title": "No"
    }
  ]
};

const uiSchema = {
  "ui:widget": "radio"
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

### Disabled attribute for `enum` fields



## Schema definitions and references

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

## Property dependencies

This library supports conditionally making fields required based on the presence of other fields.

### Unidirectional

In the following example the `billing_address` field will be required if `credit_card` is defined.

```jsx
const schema = {
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
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

### Bidirectional

In the following example the `billing_address` field will be required if `credit_card` is defined and the `credit_card`
field will be required if `billing_address` is defined making them both required if either is defined.

```jsx
const schema = {
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
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

*(Sample schemas courtesy of the [Space Telescope Science Institute](https://spacetelescope.github.io/understanding-json-schema/reference/object.html#property-dependencies))*

## Schema dependencies

This library also supports modifying portions of a schema based on form data.

### Conditional

```jsx
const schema = {
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
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

In this example the `billing_address` field will be displayed in the form if `credit_card` is defined.

*(Sample schemas courtesy of the [Space Telescope Science Institute](https://spacetelescope.github.io/understanding-json-schema/reference/object.html#schema-dependencies))*

### Dynamic

The JSON Schema standard says that the dependency is triggered if the property is present. However, sometimes it's useful to have more sophisticated rules guiding the application of the dependency. For example, maybe you have three possible values for a field, and each one should lead to adding a different question. For this, we support a very restricted use of the `oneOf` keyword.

```jsx
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
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

In this example the user is prompted with different follow-up questions dynamically based on their answer to the first question.

In these examples, the "Do you have any pets?" question is validated against the corresponding property in each schema in the `oneOf` array. If exactly one matches, the rest of that schema is merged with the existing schema.