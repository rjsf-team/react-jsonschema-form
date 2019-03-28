## Advanced customization


_ | Custom Field  | Custom Template | Custom Widget
--|---------- | ------------- | ----
What it does | Overrides all behaviour | Overrides just the layout | Overrides just the input box (not layout, labels, or help, or validation)
Usage | Global or per-field | Only global | Global or per-field
Global Example | `<Form fields={MyCustomFields} />` |  `<Form ArrayFieldTemplate={ArrayFieldTemplate} />` | `<Form widgets={MyCustomWidgets} />`
Per-Field Example | `"ui:field": MyField` |  N/A | `"ui:widget":MyWidget`
Documentation | [Field](#field-props) | [Field Template](#field-template) - [Array Template](#array-field-template) - [Object Template](#object-field-template) - [Error List Template](#error-list-template) | [Custom Widgets](#custom-widget-components)

### Field template

To take control over the inner organization of each field (each form row), you can define a *field template* for your form.

A field template is basically a React stateless component being passed field-related props, allowing you to structure your form row as you like.

```jsx
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
        FieldTemplate={CustomFieldTemplate} />,
), document.getElementById("app"));
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
- `disabled`: A boolean value stating if the field is disabled.
- `displayLabel`: A boolean value stating if the label should be rendered or not. This is useful for nested fields in arrays where you don't want to clutter the UI.
- `fields`: An array containing all Form's fields including your [custom fields](#custom-field-components) and the built-in fields.
- `schema`: The schema object for this field.
- `uiSchema`: The uiSchema object for this field.
- `formContext`: The `formContext` object that you passed to Form.

> Note: you can only define a single field template for a form. If you need many, it's probably time to look at [custom fields](#custom-field-components) instead.

### Array Field Template

Similarly to the `FieldTemplate` you can use an `ArrayFieldTemplate` to customize how your
arrays are rendered. This allows you to customize your array, and each element in the array.

```jsx
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
        ArrayFieldTemplate={ArrayFieldTemplate} />,
), document.getElementById("app"));
```

Please see [customArray.js](https://github.com/mozilla-services/react-jsonschema-form/blob/master/playground/samples/customArray.js) for a better example.

The following props are passed to each `ArrayFieldTemplate`:

- `DescriptionField`: The `DescriptionField` from the registry (in case you wanted to utilize it)
- `TitleField`: The `TitleField` from the registry (in case you wanted to utilize it).
- `canAdd`: A boolean value stating whether new elements can be added to the array.
- `className`: The className string.
- `disabled`: A boolean value stating if the array is disabled.
- `idSchema`: Object
- `items`: An array of objects representing the items in the array. Each of the items represent a child with properties described below.
- `onAddClick: (event) => void`: A function that adds a new item to the array.
- `readonly`: A boolean value stating if the array is read-only.
- `required`: A boolean value stating if the array is required.
- `schema`: The schema object for this array.
- `uiSchema`: The uiSchema object for this array field.
- `title`: A string value containing the title for the array.
- `formContext`: The `formContext` object that you passed to Form.
- `formData`: The formData for this array.

The following props are part of each element in `items`:

- `children`: The html for the item's content.
- `className`: The className string.
- `disabled`: A boolean value stating if the array item is disabled.
- `hasMoveDown`: A boolean value stating whether the array item can be moved down.
- `hasMoveUp`: A boolean value stating whether the array item can be moved up.
- `hasRemove`: A boolean value stating whether the array item can be removed.
- `hasToolbar`: A boolean value stating whether the array item has a toolbar.
- `index`: A number stating the index the array item occurs in `items`.
- `onDropIndexClick: (index) => (event) => void`: Returns a function that removes the item at `index`.
- `onReorderClick: (index, newIndex) => (event) => void`: Returns a function that swaps the items at `index` with `newIndex`.
- `readonly`: A boolean value stating if the array item is read-only.

### Object Field Template

Similarly to the `FieldTemplate` you can use an `ObjectFieldTemplate` to customize how your
objects are rendered.

```jsx
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
        ObjectFieldTemplate={ObjectFieldTemplate} />,
), document.getElementById("app"));
```

Please see [customObject.js](https://github.com/mozilla-services/react-jsonschema-form/blob/master/playground/samples/customObject.js) for a better example.

The following props are passed to each `ObjectFieldTemplate`:

- `DescriptionField`: The `DescriptionField` from the registry (in case you wanted to utilize it)
- `TitleField`: The `TitleField` from the registry (in case you wanted to utilize it).
- `title`: A string value containing the title for the object.
- `description`: A string value containing the description for the object.
- `disabled`: A boolean value stating if the object is disabled.
- `properties`: An array of object representing the properties in the array. Each of the properties represent a child with properties described below.
- `readonly`: A boolean value stating if the object is read-only.
- `required`: A boolean value stating if the object is required.
- `schema`: The schema object for this object.
- `uiSchema`: The uiSchema object for this object field.
- `idSchema`: An object containing the id for this object & ids for it's properties.
- `formData`: The form data for the object.
- `formContext`: The `formContext` object that you passed to Form.

The following props are part of each element in `properties`:

- `content`: The html for the property's content.
- `name`: A string representing the property name.
- `disabled`: A boolean value stating if the object property is disabled.
- `readonly`: A boolean value stating if the property is read-only.

### Error List template

To take control over how the form errors are displayed, you can define an *error list template* for your form. This list is the form global error list that appears at the top of your forms.

An error list template is basically a React stateless component being passed errors as props so you can render them as you like:

```jsx
function ErrorListTemplate(props) {
  const {errors} = props;
  return (
    <ul>
      {errors.map(error => (
          <li key={error.stack}>
            {error.stack}
          </li>
        ))}
    </ul>
  );
}

render((
  <Form schema={schema}
        showErrorList={true}
        ErrorList={ErrorListTemplate} />,
), document.getElementById("app"));
```

> Note: Your custom `ErrorList` template will only render when `showErrorList` is `true`.

The following props are passed to `ErrorList`

- `errors`: An array of the errors.
- `errorSchema`: The errorSchema constructed by `Form`.
- `schema`: The schema that was passed to `Form`.
- `uiSchema`: The uiSchema that was passed to `Form`.
- `formContext`: The `formContext` object that you passed to Form.

### Id prefix

To avoid collisions with existing ids in the DOM, it is possible to change the prefix used for ids (the default is `root`).

```jsx
render((
  <Form schema={schema}
        idPrefix={"rjsf_prefix"}/>,
), document.getElementById("app"));
```

This will render `<input id="rjsf_prefix_key">` instead of `<input id="root_key">`

### Custom widgets and fields

The API allows to specify your own custom *widget* and *field* components:

- A *widget* represents a HTML tag for the user to enter data, eg. `input`, `select`, etc.
- A *field* usually wraps one or more widgets and most often handles internal field state; think of a field as a form row, including the labels.

### Custom widget components

You can provide your own custom widgets to a uiSchema for the following json data types:

- `string`
- `number`
- `integer`
- `boolean`

```jsx
const schema = {
  type: "string"
};

const uiSchema = {
  "ui:widget": (props) => {
    return (
      <input type="text"
        className="custom"
        value={props.value}
        required={props.required}
        onChange={(event) => props.onChange(event.target.value)} />
    );
  }
};

render((
  <Form schema={schema}
        uiSchema={uiSchema} />,
), document.getElementById("app"));
```

The following props are passed to custom widget components:

- `id`: The generated id for this field;
- `schema`: The JSONSchema subschema object for this field;
- `value`: The current value for this field;
- `placeholder`: the placeholder for the field, if any;
- `required`: The required status of this field;
- `disabled`: `true` if the widget is disabled;
- `readonly`: `true` if the widget is read-only;
- `autofocus`: `true` if the widget should autofocus;
- `onChange`: The value change event handler; call it with the new value everytime it changes;
- `onBlur`: The input blur event handler; call it with the the widget id and value;
- `onFocus`: The input focus event handler; call it with the the widget id and value;
- `options`: A map of options passed as a prop to the component (see [Custom widget options](#custom-widget-options)).
- `formContext`: The `formContext` object that you passed to Form.

> Note: Prior to v0.35.0, the `options` prop contained the list of options (`label` and `value`) for `enum` fields. Since v0.35.0, it now exposes this list as the `enumOptions` property within the `options` object.

#### Custom component registration

Alternatively, you can register them all at once by passing the `widgets` prop to the `Form` component, and reference their identifier from the `uiSchema`:

```jsx
const MyCustomWidget = (props) => {
  return (
    <input type="text"
      className="custom"
      value={props.value}
      required={props.required}
      onChange={(event) => props.onChange(event.target.value)} />
  );
};

const widgets = {
  myCustomWidget: MyCustomWidget
};

const uiSchema = {
  "ui:widget": "myCustomWidget"
}

render((
  <Form
    schema={schema}
    uiSchema={uiSchema}
    widgets={widgets} />
), document.getElementById("app"));
```

This is useful if you expose the `uiSchema` as pure JSON, which can't carry functions.

> Note: Until 0.40.0 it was possible to register a widget as object with shape `{ component: MyCustomWidget, options: {...} }`. This undocumented API has been removed. Instead, you can register a custom widget with a React `defaultProps` property. `defaultProps.options` can be an object containing your custom options.

#### Custom widget options

If you need to pass options to your custom widget, you can add a `ui:options` object containing those properties. If the widget has `defaultProps`, the options will be merged with the (optional) options object from `defaultProps`:

```jsx
const schema = {
  type: "string"
};

function MyCustomWidget(props) {
  const {options} = props;
  const {color, backgroundColor} = options;
  return <input style={{color, backgroundColor}} />;
}

MyCustomWidget.defaultProps = {
  options: {
    color: "red"
  }
};

const uiSchema = {
  "ui:widget": MyCustomWidget,
  "ui:options": {
    backgroundColor: "yellow"
  }
};

// renders red on yellow input
render((
  <Form schema={schema}
        uiSchema={uiSchema} />
), document.getElementById("app"));
```

> Note: This also applies to [registered custom components](#custom-component-registration).

> Note: Since v0.41.0, the `ui:widget` object API, where a widget and options were specified with `"ui:widget": {component, options}` shape, is deprecated. It will be removed in a future release.

#### Customizing widgets text input

All the widgets that render a text input use the `BaseInput` component internally. If you need to customize all text inputs without customizing all widgets individually, you can provide a `BaseInput` component in the `widgets` property of `Form` (see [Custom component registration](#custom-component-registration).

### Custom field components

You can provide your own field components to a uiSchema for basically any json schema data type, by specifying a `ui:field` property.

For example, let's create and register a dumb `geo` component handling a *latitude* and a *longitude*:

```jsx
const schema = {
  type: "object",
  required: ["lat", "lon"],
  properties: {
    lat: {type: "number"},
    lon: {type: "number"}
  }
};

// Define a custom component for handling the root position object
class GeoPosition extends React.Component {
  constructor(props) {
    super(props);
    this.state = {...props.formData};
  }

  onChange(name) {
    return (event) => {
      this.setState({
        [name]: parseFloat(event.target.value)
      }, () => this.props.onChange(this.state));
    };
  }

  render() {
    const {lat, lon} = this.state;
    return (
      <div>
        <input type="number" value={lat} onChange={this.onChange("lat")} />
        <input type="number" value={lon} onChange={this.onChange("lon")} />
      </div>
    );
  }
}

// Define the custom field component to use for the root object
const uiSchema = {"ui:field": "geo"};

// Define the custom field components to register; here our "geo"
// custom field component
const fields = {geo: GeoPosition};

// Render the form with all the properties we just defined passed
// as props
render((
  <Form
    schema={schema}
    uiSchema={uiSchema}
    fields={fields} />
), document.getElementById("app"));
```

> Note: Registered fields can be reused across the entire schema.

#### Field props

A field component will always be passed the following props:

 - `schema`: The JSON schema for this field;
 - `uiSchema`: The [uiSchema](#the-uischema-object) for this field;
 - `idSchema`: The tree of unique ids for every child field;
 - `formData`: The data for this field;
 - `errorSchema`: The tree of errors for this field and its children;
 - `registry`: A [registry](#the-registry-object) object (read next).
 - `formContext`: A [formContext](#the-formcontext-object) object (read next).

#### The `registry` object

The `registry` is an object containing the registered custom fields and widgets as well as root schema definitions.

 - `fields`: The [custom registered fields](#custom-field-components). By default this object contains the standard `SchemaField`, `TitleField` and `DescriptionField` components;
 - `widgets`: The [custom registered widgets](#custom-widget-components), if any;
 - `definitions`: The root schema [definitions](#schema-definitions-and-references), if any.
 - `formContext`: The [formContext](#the-formcontext-object) object.

The registry is passed down the component tree, so you can access it from your custom field and `SchemaField` components.

#### The `formContext` object

You can provide a `formContext` object to the Form, which is passed down to all fields and widgets (including [TitleField](#custom-titles) and [DescriptionField](#custom-descriptions)). Useful for implementing context aware fields and widgets.

### Custom array field buttons

The `ArrayField` component provides a UI to add, remove and reorder array items, and these buttons use [Bootstrap glyphicons](http://getbootstrap.com/components/#glyphicons). If you don't use glyphicons but still want to provide your own icons or texts for these buttons, you can easily do so using CSS:

```css
i.glyphicon { display: none; }
.btn-add::after { content: 'Add'; }
.array-item-move-up::after { content: 'Move Up'; }
.array-item-move-down::after { content: 'Move Down'; }
.array-item-remove::after { content: 'Remove'; }
```

### Custom SchemaField

**Warning:** This is a powerful feature as you can override the whole form behavior and easily mess it up. Handle with care.

You can provide your own implementation of the `SchemaField` base React component for rendering any JSONSchema field type, including objects and arrays. This is useful when you want to augment a given field type with supplementary powers.

To proceed so, pass a `fields` object having a `SchemaField` property to your `Form` component; here's a rather silly example wrapping the standard `SchemaField` lib component:

```jsx
import SchemaField from "react-jsonschema-form/lib/components/fields/SchemaField";

const CustomSchemaField = function(props) {
  return (
    <div id="custom">
      <p>Yeah, I'm pretty dumb.</p>
      <SchemaField {...props} />
    </div>
  );
};

const fields = {
  SchemaField: CustomSchemaField
};

render((
  <Form schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        fields={fields} />
), document.getElementById("app"));
```

If you're curious how this could ever be useful, have a look at the [Kinto formbuilder](https://github.com/Kinto/formbuilder) repository to see how it's used to provide editing capabilities to any form field.

Props passed to a custom SchemaField are the same as [the ones passed to a custom field](#field-props).

### Customizing the default fields and widgets

You can override any default field and widget, including the internal widgets like the `CheckboxWidget` that `ObjectField` renders for boolean values. You can override any field and widget just by providing the customized fields/widgets in the `fields` and `widgets` props:

```jsx

const CustomCheckbox = function(props) {
  return (
    <button id="custom" className={props.value ? "checked" : "unchecked"} onClick={() => props.onChange(!props.value)}>
    	{props.value}
    </button>
  );
};

const widgets = {
  CheckboxWidget: CustomCheckbox
};

render((
  <Form schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        widgets={widgets} />
), document.getElementById("app"));
```

This allows you to create a reusable customized form class with your custom fields and widgets:

```jsx
const customFields = {StringField: CustomString};
const customWidgets = {CheckboxWidget: CustomCheckbox};

function MyForm(props) {
  return <Form fields={customFields} widgets={customWidgets} {...props} />;
}

render((
  <MyForm schema={schema}
    uiSchema={uiSchema}
    formData={formData} />
), document.getElementById("app"));
```

### Custom titles

You can provide your own implementation of the `TitleField` base React component for rendering any title. This is useful when you want to augment how titles are handled.

Simply pass a `fields` object having a `TitleField` property to your `Form` component:

```jsx

const CustomTitleField = ({title, required}) => {
  const legend = required ? title + '*' : title;
  return <div id="custom">{legend}</div>;
};

const fields = {
  TitleField: CustomTitleField
};

render((
  <Form schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        fields={fields} />
), document.getElementById("app"));
```

### Custom descriptions

You can provide your own implementation of the `DescriptionField` base React component for rendering any description.

Simply pass a `fields` object having a `DescriptionField` property to your `Form` component:

```jsx

const CustomDescriptionField = ({id, description}) => {
  return <div id={id}>{description}</div>;
};

const fields = {
  DescriptionField: CustomDescriptionField
};

render((
  <Form schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        fields={fields} />
), document.getElementById("app"));
```
