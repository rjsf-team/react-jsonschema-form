## Form customization

### The `uiSchema` object

JSONSchema is limited for describing how a given data type should be rendered as a form input component. That's why this lib introduces the concept of *UI schema*.

A UI schema is basically an object literal providing information on **how** the form should be rendered, while the JSON schema tells **what**.

The uiSchema object follows the tree structure of the form field hierarchy, and defines how each property should be rendered:

```js
const schema = {
  type: "object",
  properties: {
    foo: {
      type: "object",
      properties: {
        bar: {type: "string"}
      }
    },
    baz: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: {
            "type": "string"
          }
        }
      }
    }
  }
}

const uiSchema = {
  foo: {
    bar: {
      "ui:widget": "textarea"
    },
  },
  baz: {
    // note the "items" for an array
    items: {
      description: {
        "ui:widget": "textarea"
      }
    }
  }
}

render((
  <Form schema={schema}
        uiSchema={uiSchema} />
), document.getElementById("app"));
```

### Alternative widgets








### Object fields ordering



### Object additional properties

You can define `additionalProperties` by setting its value to a schema object, such as the following:

```js
const schema = {
  "type": "object",
  "properties": {"type": "string"},
  "additionalProperties": {"type": "number"}
}
```

In this way, an add button for new properties is shown by default. The UX for editing properties whose names are user-defined is still experimental.

You can also define `uiSchema` options for `additionalProperties` by setting the `additionalProperties` attribute in the `uiSchema`.

#### `expandable` option

You can turn support for `additionalProperties` off with the `expandable` option in `uiSchema`:

```jsx
const uiSchema = {
  "ui:options":  {
    expandable: false
  }
};
```

### Array item options

#### `orderable` option

Array items are orderable by default, and react-jsonschema-form renders move up/down buttons alongside them. The `uiSchema` object spec allows you to disable ordering:

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
```

#### `addable` option

If either `items` or `additionalItems` contains a schema object, an add button for new items is shown by default. You can turn this off with the `addable` option in `uiSchema`:

```jsx
const uiSchema = {
  "ui:options":  {
    addable: false
  }
};
```

#### `removable` option

A remove button is shown by default for an item if `items` contains a schema object, or the item is an `additionalItems` instance. You can turn this off with the `removable` option in `uiSchema`:

```jsx
const uiSchema = {
  "ui:options":  {
    removable: false
  }
};
```

### Custom CSS class names


### Custom labels for `enum` fields

This library supports the [`enumNames`](https://github.com/json-schema/json-schema/wiki/enumNames-%28v5-proposal%29) property for `enum` fields, which allows defining custom labels for each option of an `enum`:

```js
const schema = {
  type: "number",
  enum: [1, 2, 3],
  enumNames: ["one", "two", "three"]
};
```

This will be rendered using a select box like this:

```html
<select>
  <option value="1">one</option>
  <option value="2">two</option>
  <option value="3">three</option>
</select>
```

Note that string representations of numbers will be cast back and reflected as actual numbers into form state.

#### Alternative JSON-Schema compliant approach

JSON Schema has an alternative approach to enumerations; react-jsonschema-form supports it as well.

```js
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
```

This will be rendered as follows:

```html
<select>
  <option value="1">one</option>
  <option value="2">two</option>
  <option value="3">three</option>
</select>
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
```

This will be rendered as follows:

```html
<div class="field-radio-group">
  <div class="radio">
    <label>
      <span>
        <input type="radio" name="0.005549338200675935" value="true"><span>Enable</span>
      </span>
    </label>
  </div>
  <div class="radio">
    <label>
      <span>
        <input type="radio" name="0.005549338200675935" value="false"><span>Disable</span>
      </span>
    </label>
  </div>
</div>
```

A live example of both approaches side-by-side can be found in the **Alternatives** tab of the [playground](https://rjsf-team.github.io/react-jsonschema-form/).

### Disabled attribute for `enum` fields



### Multiple-choice list

The default behavior for array fields is a list of text inputs with add/remove buttons. There are two alternative widgets for picking multiple elements from a list of choices. Typically this applies when a schema has an `enum` list for the `items` property of an `array` field, and the `uniqueItems` property set to `true`.

Example:

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
```

By default, this will render a multiple select box. If you prefer a list of checkboxes, just set the uiSchema `ui:widget` directive to `checkboxes` for that field:

```js
const uiSchema = {
  "ui:widget": "checkboxes"
};
```

Note that when an array property is marked as `required`, an empty array is considered valid. If array needs to be populated, you can specify the minimum number of items using the `minItems` property.

Example:

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
```

By default, checkboxes are stacked. If you prefer them inline, set the `inline` property to `true`:

```js
const uiSchema = {
  "ui:widget": "checkboxes",
  "ui:options": {
    inline: true
  }
};
```

See the "Arrays" section of the [playground](https://rjsf-team.github.io/react-jsonschema-form/) for cool demos.

### Autogenerated widget ids



### Form action buttons

### Help text


### Title texts

### Description texts



### Auto focus



### Textarea `rows` option



### Placeholders



### Field labels



### HTML5 Input Types
