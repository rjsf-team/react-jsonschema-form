# Objects

## Object properties

Objects are defined with a type equal to `object` and properties specified in the `properties` keyword.

```jsx
const schema = {
  "title": "My title",
  "description": "My description",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "age": {
      "type": "number"
    }
  }
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## Object additional properties

The `additionalProperties` keyword allows the user to add properties with arbitrary key names. Set this keyword equal to a schema object:

```jsx
const schema = {
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    }
  },
  "additionalProperties": {
    "type": "number",
    "enum": [1, 2, 3]
  }
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

In this way, an add button for new properties is shown by default.

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