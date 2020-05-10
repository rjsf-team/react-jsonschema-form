# oneOf, anyOf, and allOf

react-jsonschema-form supports custom widgets for oneOf, anyOf, and allOf.

- A schema with oneOf is valid if *exactly one* of the subschemas is valid.
- A schema with allOf is valid if *at least one* of the subschemas is valid.
- A schema with allOf is valid if *all* of the subschemas are valid.

## oneOf

```jsx
const schema = {
    type: "object",
    oneOf: [
      {
        properties: {
          lorem: {
            type: "string",
          },
        },
        required: ["lorem"],
      },
      {
        properties: {
          ipsum: {
            type: "string",
          },
        },
        required: ["ipsum"],
      },
    ],
  };

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## anyOf

```jsx
const schema = {
    type: "object",
    anyOf: [
      {
        properties: {
          lorem: {
            type: "string",
          },
        },
        required: ["lorem"],
      },
      {
        properties: {
          lorem: {
            type: "string",
          },
          ipsum: {
            type: "string",
          },
        }
      },
    ],
  };

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## allOf

When `allOf` is specified in a schema, react-jsonschema-form uses the `json-schema-merge-allof` library to merge the specified subschemas to create a combined subschema that is valid. For example, see the below schema:

```jsx
const schema = {
    type: "object",
    allOf: [
      {
        type: ["string", "boolean"]
      },
      {
        type: "boolean"
      },
    ],
  };

render((
  <Form schema={schema} />
), document.getElementById("app"));
```