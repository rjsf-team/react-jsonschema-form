# Custom Widgets and Fields

The API allows to specify your own custom *widget* and *field* components:

- A *widget* represents a HTML tag for the user to enter data, eg. `input`, `select`, etc.
- A *field* usually wraps one or more widgets and most often handles internal field state; think of a field as a form row, including the labels.

## Customizing the default fields and widgets

You can override any default field and widget, including the internal widgets like the `CheckboxWidget` that `ObjectField` renders for boolean values. You can override any field and widget just by providing the customized fields/widgets in the `fields` and `widgets` props:

```jsx
const schema = {
  type: "boolean",
  default: true
};

const uiSchema = {
  "ui:widget": "checkbox"
};

const CustomCheckbox = function(props) {
  return (
    <button id="custom" className={props.value ? "checked" : "unchecked"} onClick={() => props.onChange(!props.value)}>
    	{String(props.value)}
    </button>
  );
};

const widgets = {
  CheckboxWidget: CustomCheckbox
};

render((
  <Form schema={schema}
        uiSchema={uiSchema}
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
```

The default fields you can override are:

 - `ArrayField`
 - `BooleanField`
 - `DescriptionField`
 - `OneOfField`
 - `AnyOfField`
 - `NullField`
 - `NumberField`
 - `ObjectField`
 - `SchemaField`
 - `StringField`
 - `TitleField`
 - `UnsupportedField`

The default widgets you can override are:

 - `AltDateTimeWidget`
 - `AltDateWidget`
 - `CheckboxesWidget`
 - `CheckboxWidget`
 - `ColorWidget`
 - `DateTimeWidget`
 - `DateWidget`
 - `EmailWidget`
 - `FileWidget`
 - `HiddenWidget`
 - `PasswordWidget`
 - `RadioWidget`
 - `RangeWidget`
 - `SelectWidget`
 - `TextareaWidget`
 - `TextWidget`
 - `UpDownWidget`
 - `URLWidget`


## Adding your own custom widgets

You can provide your own custom widgets to a uiSchema for the following json data types:

- `string`
- `number`
- `integer`
- `boolean`
- `array`

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
        uiSchema={uiSchema} />
), document.getElementById("app"));
```

The following props are passed to custom widget components:

- `id`: The generated id for this widget;
- `schema`: The JSONSchema subschema object for this widget;
- `uiSchema`: The uiSchema for this widget;
- `value`: The current value for this widget;
- `placeholder`: the placeholder for the field, if any;
- `required`: The required status of this widget;
- `disabled`: `true` if the widget is disabled;
- `readonly`: `true` if the widget is read-only;
- `autofocus`: `true` if the widget should autofocus;
- `onChange`: The value change event handler; call it with the new value every time it changes;
- `onKeyChange`: The key change event handler (only called for fields with `additionalProperties`); pass the new value every time it changes;
- `onBlur`: The input blur event handler; call it with the the widget id and value;
- `onFocus`: The input focus event handler; call it with the the widget id and value;
- `options`: A map of options passed as a prop to the component (see [Custom widget options](#custom-widget-options)).
- `options.enumOptions`: For enum fields, this property contains the list of options for the enum as an array of \{ label, value } objects. If the enum is defined using the oneOf/anyOf syntax, the entire schema object for each option is appended onto the \{ schema, label, value } object.
- `formContext`: The `formContext` object that you passed to Form.
- `rawErrors`: An array of strings listing all generated error messages from encountered errors for this widget.
 - `registry`: A [registry](#the-registry-object) object (read next).

### Custom component registration

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

const schema = {
  type: "string"
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

### Custom widget options

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

### Customizing widgets text input

All the widgets that render a text input use the `BaseInput` component internally. If you need to customize all text inputs without customizing all widgets individually, you can provide a `BaseInput` component in the `widgets` property of `Form` (see [Custom component registration](#custom-component-registration)).

## Custom field components

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

### Field props

A field component will always be passed the following props:

 - `schema`: The JSON schema for this field;
 - `uiSchema`: The [uiSchema](#the-uischema-object) for this field;
 - `idSchema`: The tree of unique ids for every child field;
 - `formData`: The data for this field;
 - `errorSchema`: The tree of errors for this field and its children;
 - `registry`: A [registry](#the-registry-object) object (read next).
 - `formContext`: A [formContext](#the-formcontext-object) object (read next).

## The `registry` object

The `registry` is an object containing the registered custom fields and widgets as well as the root schema definitions.

 - `fields`: All fields, including [custom registered fields](#custom-field-components), if any;
 - `widgets`: All widgets, including, [custom registered widgets](#custom-widget-components), if any;
 - `rootSchema`: The root schema, which can contain referenced [definitions](#schema-definitions-and-references);
 - `formContext`: The [formContext](#the-formcontext-object) object;
 - `definitions` (deprecated since v2): Equal to `rootSchema.definitions`.

The registry is passed down the component tree, so you can access it from your custom field, custom widget, and `SchemaField` components.

### Custom SchemaField

**Warning:** This is a powerful feature as you can override the whole form behavior and easily mess it up. Handle with care.

You can provide your own implementation of the `SchemaField` base React component for rendering any JSONSchema field type, including objects and arrays. This is useful when you want to augment a given field type with supplementary powers.

To proceed so, pass a `fields` object having a `SchemaField` property to your `Form` component; here's an example:

```jsx

const CustomSchemaField = function(props) {
  return (
    <div id="custom">
      <p>Yeah, I'm pretty dumb.</p>
      <div>My props are: {JSON.stringify(props)}</div>
    </div>
  );
};

const fields = {
  SchemaField: CustomSchemaField
};

const schema = {
  type: "string"
};

render((
  <Form schema={schema}
        fields={fields} />
), document.getElementById("app"));
```

If you're curious how this could ever be useful, have a look at the [Kinto formbuilder](https://github.com/Kinto/formbuilder) repository to see how it's used to provide editing capabilities to any form field.

Props passed to a custom SchemaField are the same as [the ones passed to a custom field](#field-props).

NOTE: If you are using the `material-ui` theme and are considering customizing a widget or a field, checkout this [guide](material-ui/customizing-material-ui.md).
