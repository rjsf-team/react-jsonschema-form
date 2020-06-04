# Single fields

The simplest example of a JSON Schema contains only a single field. The field type is determined by the `type` parameter.

## Field types

The base field types in JSON Schema include:

- `string`
- `number`
- `integer`
- `boolean`
- `null`

Here is an example of a string field:

```jsx
const schema = {
  type: "string"
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## Titles and descriptions

Fields can have titles and descriptions specified by the `title` keyword in the schema and `description` keyword in the schema, respectively. These two can also be overriden by the `ui:title` and `ui:description` keywords in the uiSchema.

```jsx
const schema = {
  title: "My form",
  description: "My description",
  type: "string"
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## Enumerated values

All base schema types support the `enum` attribute, which restricts the user to select among a list of options. For example:

```jsx
const schema = {
  type: "string",
  enum: ["one", "two", "three"]
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

### Custom labels for `enum` fields

This library supports a custom [`enumNames`](https://github.com/rjsf-team/react-jsonschema-form/issues/57) property for `enum` fields, which, however is not JSON-Schema compliant (see below for a compliant approach). The `enumNames` property allows defining custom labels for each option of an `enum`:

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

JSON Schema has an alternative approach to enumerations using `anyOf`; react-jsonschema-form supports it as well.

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

### Disabled attribute for `enum` fields

To disable an option, use the `ui:enumDisabled` property in the uiSchema.

```jsx
const schema = {
  type: "boolean",
  enum: [true, false]
};

const uiSchema={
  "ui:enumDisabled": [true],
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```


## Nullable types

JSON Schema supports specifying multiple types in an array; however, react-jsonschema-form only supports a restricted subset of this -- nullable types, in which an element is either a given type or equal to null.

```jsx
const schema = {
  type: ["string", "null"]
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```
