# Custom Templates

This is an advanced feature that lets you customize even more aspects of the form:

_ | Custom Field  | Custom Template | Custom Widget
--|---------- | ------------- | ----
**What it does** | Overrides all behaviour | Overrides just the layout (not behaviour) | Overrides just the input box (not layout, labels, or help, or validation)
**Usage** | Global or per-field | Global or per-field | Global or per-field
**Global Example** | `<Form fields={MyCustomField} />` |  `<Form ArrayFieldTemplate={MyArrayTemplate} />` | `<Form widgets={MyCustomWidget} />`
**Per-Field Example** | `"ui:field": MyCustomField` |  `"ui:ArrayFieldTemplate": MyArrayTemplate` | `"ui:widget":MyCustomWidget`
**Documentation** | [Custom Fields](custom-widgets-fields.md) | [FieldTemplate](#FieldTemplate) / [ArrayFieldTemplate](#ArrayFieldTemplate) / [ObjectFieldTemplate](#ObjectFieldTemplate) | [Custom Widgets](custom-widgets-fields.md)

## ArrayFieldTemplate

You can use an `ArrayFieldTemplate` to customize how your arrays are rendered. 
This allows you to customize your array, and each element in the array. You can also customize arrays by specifying a widget in the relevant `ui:widget` schema, more details over on [Custom Widgets](../usage/arrays.md#custom-widgets). 


```jsx
const schema = {
  type: "array",
  items: {
    type: "string"
  }
};

function ArrayFieldTemplate(props) {
  return (
    <div>
      {props.items.map(element => element.children)}
      {props.canAdd && <button type="button" onClick={props.onAddClick}></button>}
    </div>
  );
}

render((
  <Form schema={schema}
        ArrayFieldTemplate={ArrayFieldTemplate} />
), document.getElementById("app"));
```

You also can provide your own field template to a uiSchema by specifying a `ui:ArrayFieldTemplate` property.

```js
const uiSchema = {
  "ui:ArrayFieldTemplate": ArrayFieldTemplate
}
```

Please see [customArray.js](https://github.com/rjsf-team/react-jsonschema-form/blob/4542cd254ffdc6dfaf55e8c9f6f17dc900d0d041/packages/playground/src/samples/customArray.js) for another example.

The following props are passed to each `ArrayFieldTemplate`:

- `DescriptionField`: The `DescriptionField` from the registry (in case you wanted to utilize it)
- `TitleField`: The `TitleField` from the registry (in case you wanted to utilize it).
- `canAdd`: A boolean value stating whether new elements can be added to the array.
- `className`: The className string.
- `disabled`: A boolean value stating if the array is disabled.
- `idSchema`: Object
- `items`: An array of objects representing the items in the array. Each of the items represent a child with properties described below.
- `onAddClick: (event?) => void`: A function that adds a new item to the array.
- `readonly`: A boolean value stating if the array is read-only.
- `required`: A boolean value stating if the array is required.
- `schema`: The schema object for this array.
- `uiSchema`: The uiSchema object for this array field.
- `title`: A string value containing the title for the array.
- `formContext`: The `formContext` object that you passed to Form.
- `formData`: The formData for this array.
- `registry`: The `registry` object.

The following props are part of each element in `items`:

- `children`: The html for the item's content.
- `className`: The className string.
- `disabled`: A boolean value stating if the array item is disabled.
- `hasMoveDown`: A boolean value stating whether the array item can be moved down.
- `hasMoveUp`: A boolean value stating whether the array item can be moved up.
- `hasRemove`: A boolean value stating whether the array item can be removed.
- `hasToolbar`: A boolean value stating whether the array item has a toolbar.
- `index`: A number stating the index the array item occurs in `items`.
- `key`: A stable, unique key for the array item.
- `onAddIndexClick: (index) => (event?) => void`: Returns a function that adds a new item at `index`.
- `onDropIndexClick: (index) => (event?) => void`: Returns a function that removes the item at `index`.
- `onReorderClick: (index, newIndex) => (event?) => void`: Returns a function that swaps the items at `index` with `newIndex`.
- `readonly`: A boolean value stating if the array item is read-only.

> Note: Array and object field templates are always rendered inside of the FieldTemplate. To fully customize an array field template, you may need to specify both `ui:FieldTemplate` and `ui:ArrayFieldTemplate`.

## FieldTemplate

To take control over the inner organization of each field (each form row), you can define a *field template* for your form.

A field template is basically a React stateless component being passed field-related props, allowing you to structure your form row as you like.

```jsx
const schema = {
  type: "string"
};

function CustomFieldTemplate(props) {
  const {id, classNames, label, help, required, description, errors, children} = props;
  return (
    <div className={classNames}>
      <label htmlFor={id}>{label}{required ? "*" : null}</label>
      {description}
      {children}
      {errors}
      {help}
    </div>
  );
}

render((
  <Form schema={schema}
        FieldTemplate={CustomFieldTemplate} />
), document.getElementById("app"));
```

You also can provide your own field template to a uiSchema by specifying a `ui:FieldTemplate` property.

```js
const uiSchema = {
  "ui:FieldTemplate": CustomFieldTemplate
}
```

If you want to handle the rendering of each element yourself, you can use the props `rawHelp`, `rawDescription` and `rawErrors`.

The following props are passed to a custom field template component:

- `id`: The id of the field in the hierarchy. You can use it to render a label targeting the wrapped widget.
- `classNames`: A string containing the base Bootstrap CSS classes, merged with any [custom ones](#custom-css-class-names) defined in your uiSchema.
- `label`: The computed label for this field, as a string.
- `description`: A component instance rendering the field description, if one is defined (this will use any [custom `DescriptionField`](#custom-descriptions) defined).
- `rawDescription`: A string containing any `ui:description` uiSchema directive defined.
- `children`: The field or widget component instance for this field row.
- `errors`: A component instance listing any encountered errors for this field.
- `rawErrors`: An array of strings listing all generated error messages from encountered errors for this field.
- `help`: A component instance rendering any `ui:help` uiSchema directive defined.
- `rawHelp`: A string containing any `ui:help` uiSchema directive defined. **NOTE:** `rawHelp` will be `undefined` if passed `ui:help` is a React component instead of a string.
- `hidden`: A boolean value stating if the field should be hidden.
- `required`: A boolean value stating if the field is required.
- `readonly`: A boolean value stating if the field is read-only.
- `hideError`: A boolean value stating if the field is hiding its errors
- `disabled`: A boolean value stating if the field is disabled.
- `displayLabel`: A boolean value stating if the label should be rendered or not. This is useful for nested fields in arrays where you don't want to clutter the UI.
- `fields`: An array containing all Form's fields including your [custom fields](#custom-field-components) and the built-in fields.
- `schema`: The schema object for this field.
- `uiSchema`: The uiSchema object for this field.
- `onChange`: The value change event handler; Can be called with a new value to change the value for this field.
- `formContext`: The `formContext` object that you passed to Form.
- `formData`: The formData for this field.
- `registry`: The `registry` object.

> Note: you can only define a single global field template for a form, but you can set individual field templates per property using `"ui:FieldTemplate"`.

## ObjectFieldTemplate

```jsx
const schema = {
  type: "object",
  title: "Object title",
  description: "Object description",
  properties: {
    name: {
      type: "string"
    },
    age: {
      type: "number"
    }
  }
};

function ObjectFieldTemplate(props) {
  return (
    <div>
      {props.title}
      {props.description}
      {props.properties.map(element => <div className="property-wrapper">{element.content}</div>)}
    </div>
  );
}

render((
  <Form schema={schema}
        ObjectFieldTemplate={ObjectFieldTemplate} />
), document.getElementById("app"));
```

You also can provide your own field template to a uiSchema by specifying a `ui:ObjectFieldTemplate` property.

```js
const uiSchema = {
  "ui:ObjectFieldTemplate": ObjectFieldTemplate
};
```

Please see [customObject.js](https://github.com/rjsf-team/react-jsonschema-form/blob/4542cd254ffdc6dfaf55e8c9f6f17dc900d0d041/packages/playground/src/samples/customObject.js) for a better example.

The following props are passed to each `ObjectFieldTemplate`:

- `DescriptionField`: The `DescriptionField` from the registry (in case you wanted to utilize it)
- `TitleField`: The `TitleField` from the registry (in case you wanted to utilize it).
- `title`: A string value containing the title for the object.
- `description`: A string value containing the description for the object.
- `disabled`: A boolean value stating if the object is disabled.
- `properties`: An array of object representing the properties in the array. Each of the properties represent a child with properties described below.
- `onAddClick: (schema: JSONSchema7) => () => void`: Returns a function that adds a new property to the object (to be used with additionalProperties)
- `readonly`: A boolean value stating if the object is read-only.
- `required`: A boolean value stating if the object is required.
- `schema`: The schema object for this object.
- `uiSchema`: The uiSchema object for this object field.
- `idSchema`: An object containing the id for this object & ids for it's properties.
- `formData`: The form data for the object.
- `formContext`: The `formContext` object that you passed to Form.
- `registry`: The `registry` object.

The following props are part of each element in `properties`:

- `content`: The html for the property's content.
- `name`: A string representing the property name.
- `disabled`: A boolean value stating if the object property is disabled.
- `readonly`: A boolean value stating if the property is read-only.
- `hidden`: A boolean value stating if the property should be hidden.

> Note: Array and object field templates are always rendered inside of the FieldTemplate. To fully customize an object field template, you may need to specify both `ui:FieldTemplate` and `ui:ObjectFieldTemplate`.
