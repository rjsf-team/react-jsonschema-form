# Arrays

Arrays are defined with a type equal to `array`, and array items' schemas are specified in the `items` keyword.

## Arrays of a single field

Arrays of a single field type can be specified as follows:

```jsx
const schema = {
  type: "array",
  items: {
    type: "string"
  }
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## Arrays of objects

Arrays of objects can be specified as follows:

```jsx
const schema = {
  type: "array",
  items: {
    type: "object",
    properties: {
        name: {
            type: "string"
        }
    }
  }
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## uiSchema for array items

To specify a uiSchema that applies to array items, specify the uiSchema value within the `items` property:

```jsx
const schema = {
  type: "array",
  items: {
    type: "string"
  }
};

const uiSchema = {
  items: {
    "ui:widget": "textarea"
  }
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

## The `additionalItems` keyword

The `additionalItems` keyword allows the user to add additional items of a given schema. For example:

```jsx
const schema = {
  type: "array",
  items: {
    type: "string"
  },
  additionalItems: {
    type: "boolean"
  }
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## Array item options

### `orderable` option

Array items are orderable by default, and react-jsonschema-form renders move up/down buttons alongside them. The uiSchema `orderable` options allows you to disable ordering:

```jsx
const schema = {
  type: "array",
  items: {
    type: "string"
  }
};

const uiSchema = {
  "ui:options":  {
    orderable: false
  }
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

### `addable` option

If either `items` or `additionalItems` contains a schema object, an add button for new items is shown by default. You can turn this off with the `addable` option in `uiSchema`:

```jsx
const schema = {
  type: "array",
  items: {
    type: "string"
  }
};

const uiSchema = {
  "ui:options":  {
    addable: false
  }
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

### `removable` option

A remove button is shown by default for an item if `items` contains a schema object, or the item is an `additionalItems` instance. You can turn this off with the `removable` option in `uiSchema`:

```jsx
const schema = {
  type: "array",
  items: {
    type: "string"
  }
};

const uiSchema = {
  "ui:options":  {
    removable: false
  }
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```


## Multiple-choice list

The default behavior for array fields is a list of text inputs with add/remove buttons. There are two alternative widgets for picking multiple elements from a list of choices. Typically this applies when a schema has an `enum` list for the `items` property of an `array` field, and the `uniqueItems` property set to `true`.

Example:

```jsx
const schema = {
  type: "array",
  title: "A multiple-choice list",
  items: {
    type: "string",
    enum: ["foo", "bar", "fuzz", "qux"],
  },
  uniqueItems: true
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

By default, this will render a multiple select box. If you prefer a list of checkboxes, just set the uiSchema `ui:widget` directive to `checkboxes` for that field:

```js
const schema = {
  type: "array",
  title: "A multiple-choice list",
  items: {
    type: "string",
    enum: ["foo", "bar", "fuzz", "qux"],
  },
  uniqueItems: true
};

const uiSchema = {
  "ui:widget": "checkboxes"
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```


## Specifying the minimum or maximum number of items

Note that when an array property is marked as `required`, an empty array is considered valid. If the array needs to be populated, you can specify the minimum number of items using the `minItems` property.

Example:

```jsx
const schema = {
  type: "array",
  minItems: 2,
  title: "A multiple-choice list",
  items: {
    type: "string",
    enum: ["foo", "bar", "fuzz", "qux"],
  },
  uniqueItems: true
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

You can also specify the maximum number of items in an array using the `maxItems` property.


## Inline checkboxes

By default, checkboxes are stacked. If you prefer them inline, set the `inline` property to `true`:

```js
const schema = {
  type: "array",
  minItems: 2,
  title: "A multiple-choice list",
  items: {
    type: "string",
    enum: ["foo", "bar", "fuzz", "qux"],
  },
  uniqueItems: true
};

const uiSchema = {
  "ui:widget": "checkboxes",
  "ui:options": {
    inline: true
  }
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```