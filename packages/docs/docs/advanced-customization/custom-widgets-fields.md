# Custom Widgets and Fields

The API allows to specify your own custom _widget_ and _field_ components:

- A _widget_ represents a HTML tag for the user to enter data, eg. `input`, `select`, etc.
- A _field_ usually wraps one or more widgets and most often handles internal field state; think of a field as a form row, including the labels.

## Customizing the default fields and widgets

You can override any default field and widget, including the internal widgets like the `CheckboxWidget` that `ObjectField` renders for boolean values. You can override any field and widget just by providing the customized fields/widgets in the `fields` and `widgets` props:

```tsx
import { RJSFSchema, UiSchema, WidgetProps, RegistryWidgetsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'boolean',
  default: true,
};

const uiSchema: UiSchema = {
  'ui:widget': 'checkbox',
};

const CustomCheckbox = function (props: WidgetProps) {
  return (
    <button id='custom' className={props.value ? 'checked' : 'unchecked'} onClick={() => props.onChange(!props.value)}>
      {String(props.value)}
    </button>
  );
};

const widgets: RegistryWidgetsType = {
  CheckboxWidget: CustomCheckbox,
};

render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} widgets={widgets} />,
  document.getElementById('app')
);
```

This allows you to create a reusable customized form class with your custom fields and widgets:

```tsx
import { RegistryFieldsType, RegistryWidgetsType } from '@rjsf/utils';
import { FormProps } from '@rjsf/core';

const customFields: RegistryFieldsType = { StringField: CustomString };
const customWidgets: RegistryWidgetsType = { CheckboxWidget: CustomCheckbox };

function MyForm(props: FormProps) {
  return <Form fields={customFields} widgets={customWidgets} {...props} />;
}
```

The default fields you can override are:

- `ArrayField`
- `ArraySchemaField`
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
- `TimeWidget`
- `UpDownWidget`
- `URLWidget`

## Adding your own custom widgets

You can provide your own custom widgets to a uiSchema for the following json data types:

- `string`
- `number`
- `integer`
- `boolean`
- `array`

```tsx
import { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: Schema = {
  type: 'string',
};

const uiSchema: UiSchema = {
  'ui:widget': (props: WidgetProps) => {
    return (
      <input
        type='text'
        className='custom'
        value={props.value}
        required={props.required}
        onChange={(event) => props.onChange(event.target.value)}
      />
    );
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

The following props are passed to custom widget components:

- `id`: The generated id for this widget, used to provide unique `name`s and `id`s for the HTML field elements rendered by widgets;
- `name`: The unique name of the field, usually derived from the name of the property in the JSONSchema; Provided in support of custom widgets;
- `schema`: The JSONSchema subschema object for this widget;
- `uiSchema`: The uiSchema for this widget;
- `value`: The current value for this widget;
- `placeholder`: The placeholder for the widget, if any;
- `required`: The required status of this widget;
- `disabled`: A boolean value stating if the widget is disabled;
- `readonly`: A boolean value stating if the widget is read-only;
- `autofocus`: A boolean value stating if the widget should autofocus;
- `label`: The computed label for this widget, as a string
- `hideLabel`: A boolean value, if true, will cause the label to be hidden. This is useful for nested fields where you don't want to clutter the UI. Customized via `label` in the `UiSchema`;
- `multiple`: A boolean value stating if the widget can accept multiple values;
- `onChange`: The value change event handler; call it with the new value every time it changes;
- `onKeyChange`: The key change event handler (only called for fields with `additionalProperties`); pass the new value every time it changes;
- `onBlur`: The input blur event handler; call it with the widget id and value;
- `onFocus`: The input focus event handler; call it with the widget id and value;
- `options`: A map of options passed as a prop to the component (see [Custom widget options](#custom-widget-options)).
- `options.enumOptions`: For enum fields, this property contains the list of options for the enum as an array of { label, value } objects. If the enum is defined using the oneOf/anyOf syntax, the entire schema object for each option is appended onto the { schema, label, value } object.
- `formContext`: The `formContext` object that you passed to `Form`.
- `rawErrors`: An array of strings listing all generated error messages from encountered errors for this widget.
- `registry`: A [registry](#the-registry-object) object (read next).

### Custom component registration

Alternatively, you can register them all at once by passing the `widgets` prop to the `Form` component, and reference their identifier from the `uiSchema`:

```tsx
import { RJSFSchema, UiSchema, WidgetProps, RegistryWidgetsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const MyCustomWidget = (props: WidgetProps) => {
  return (
    <input
      type='text'
      className='custom'
      value={props.value}
      required={props.required}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
};

const widgets: RegistryWidgetsType = {
  myCustomWidget: MyCustomWidget,
};

const schema: RJSFSchema = {
  type: 'string',
};

const uiSchema: UiSchema = {
  'ui:widget': 'myCustomWidget',
};

render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} widgets={widgets} />,
  document.getElementById('app')
);
```

This is useful if you expose the `uiSchema` as pure JSON, which can't carry functions.

### Custom widget options

If you need to pass options to your custom widget, you can add a `ui:options` object containing those properties. If the widget has `defaultProps`, the options will be merged with the (optional) options object from `defaultProps`:

```tsx
import { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

function MyCustomWidget(props: WidgetProps) {
  const { options } = props;
  const { color, backgroundColor } = options;
  return <input style={{ color, backgroundColor }} />;
}

MyCustomWidget.defaultProps = {
  options: {
    color: 'red',
  },
};

const uiSchema: UiSchema = {
  'ui:widget': MyCustomWidget,
  'ui:options': {
    backgroundColor: 'yellow',
  },
};

// renders red on yellow input
render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

> Note: This also applies to [registered custom components](#custom-component-registration).

> Note: Since v0.41.0, the `ui:widget` object API, where a widget and options were specified with `"ui:widget": {component, options}` shape, is deprecated. It will be removed in a future release.

### Customizing widgets' text input

All the widgets that render a text input use the `BaseInputTemplate` component internally. If you need to customize all text inputs without customizing all widgets individually, you can provide a `BaseInputTemplate` component in the `templates` property of `Form` (see [Custom Templates](./custom-templates.md#baseinputtemplate)).

## Custom field components

You can provide your own field components to a uiSchema for basically any json schema data type, by specifying a `ui:field` property.

For example, let's create and register a dumb `geo` component handling a _latitude_ and a _longitude_:

```tsx
import { RJSFSchema, UiSchema, FieldProps, RegistryFieldsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  required: ['lat', 'lon'],
  properties: {
    lat: { type: 'number' },
    lon: { type: 'number' },
  },
};

// Define a custom component for handling the root position object
class GeoPosition extends React.Component<FieldProps> {
  constructor(props: FieldProps) {
    super(props);
    this.state = { ...props.formData };
  }

  onChange(name) {
    return (event) => {
      this.setState(
        {
          [name]: parseFloat(event.target.value),
        },
        () => this.props.onChange(this.state)
      );
    };
  }

  render() {
    const { lat, lon } = this.state;
    return (
      <div>
        <input type='number' value={lat} onChange={this.onChange('lat')} />
        <input type='number' value={lon} onChange={this.onChange('lon')} />
      </div>
    );
  }
}

// Define the custom field component to use for the root object
const uiSchema: UiSchema = { 'ui:field': 'geo' };

// Define the custom field components to register; here our "geo"
// custom field component
const fields: RegistryFieldsType = { geo: GeoPosition };

// Render the form with all the properties we just defined passed
// as props
render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} fields={fields} />,
  document.getElementById('app')
);
```

> Note: Registered fields can be reused across the entire schema.

### Field props

A field component will always be passed the following props:

- `schema`: The JSON subschema object for this field;
- `uiSchema`: The [uiSchema](../api-reference/uiSchema.md) for this field;
- `idSchema`: The tree of unique ids for every child field;
- `formData`: The data for this field;
- `errorSchema`: The tree of errors for this field and its children;
- `registry`: A [registry](#the-registry-object) object (read next).
- `formContext`: A [formContext](../api-reference/form-props.md#formcontext) object (read next).
- `required`: The required status of this field;
- `disabled`: A boolean value stating if the field is disabled;
- `readonly`: A boolean value stating if the field is read-only;
- `autofocus`: A boolean value stating if the field should autofocus;
- `name`: The unique name of the field, usually derived from the name of the property in the JSONSchema
- `idPrefix`: To avoid collisions with existing ids in the DOM, it is possible to change the prefix used for ids; Default is `root`
- `idSeparator`: To avoid using a path separator that is present in field names, it is possible to change the separator used for ids (Default is `_`)
- `rawErrors`: `An array of strings listing all generated error messages from encountered errors for this field
- `onChange`: The field change event handler; called with the updated form data and an optional `ErrorSchema`
- `onBlur`: The input blur event handler; call it with the field id and value;
- `onFocus`: The input focus event handler; call it with the field id and value;

## The `registry` object

The `registry` is an object containing the registered core, theme and custom fields and widgets as well as the root schema, form context, schema utils.

- `fields`: The set of all fields used by the `Form`. Includes fields from `core`, theme-specific fields and any [custom registered fields](#custom-field-components);
- `widgets`: The set of all widgets used by the `Form`. Includes widgets from `core`, theme-specific widgets and any [custom registered widgets](#custom-component-registration), if any;
- `rootSchema`: The root schema, as passed to the `Form`, which can contain referenced [definitions](../usage/definitions.md);
- `formContext`: The [formContext](../api-reference/form-props.md#formcontext) that was passed to `Form`;
- `schemaUtils`: The current implementation of the `SchemaUtilsType` (from `@rjsf/utils`) in use by the `Form`. Used to call any of the validation-schema-based utility functions.

The registry is passed down the component tree, so you can access it from your custom field, custom widget, custom template and `SchemaField` components.

### Custom SchemaField

**Warning:** This is a powerful feature as you can override the whole form behavior and easily mess it up. Handle with care.

You can provide your own implementation of the `SchemaField` base React component for rendering any JSONSchema field type, including objects and arrays. This is useful when you want to augment a given field type with supplementary powers.

To proceed so, pass a `fields` object having a `SchemaField` property to your `Form` component; here's an example:

```tsx
import { RJSFSchema, FieldProps, RegistryFieldsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const CustomSchemaField = function (props: FieldProps) {
  return (
    <div id='custom'>
      <p>Yeah, I'm pretty dumb.</p>
      <div>My props are: {JSON.stringify(props)}</div>
    </div>
  );
};

const fields: RegistryFieldsType = {
  SchemaField: CustomSchemaField,
};

const schema: RJSFSchema = {
  type: 'string',
};

render(<Form schema={schema} validator={validator} fields={fields} />, document.getElementById('app'));
```

If you're curious how this could ever be useful, have a look at the [Kinto formbuilder](https://github.com/Kinto/formbuilder) repository to see how it's used to provide editing capabilities to any form field.

Props passed to a custom SchemaField are the same as [the ones passed to a custom field](#field-props).

### Custom ArraySchemaField

Everything that was mentioned above for a `Custom SchemaField` applies, but this is only used to render the Array item `children` that are then passed to the `ArrayFieldItemTemplate`.
By default, `ArraySchemaField` is not actually implemented in the `fields` list since `ArrayField` falls back to `SchemaField` if `ArraySchemaField` is not provided.
If you want to customize how the individual items for an array are rendered, provide your implementation of `ArraySchemaField` as a `fields` override.

```tsx
import { RJSFSchema, UiSchema, FieldProps, RegistryFieldsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const CustomArraySchemaField = function (props: FieldProps) {
  const { index, registry } = props;
  const { SchemaField } = registry.fields;
  const name = `Index ${index}`;
  return <SchemaField {...props} name={name} />;
};

const fields: RegistryFieldsType = {
  ArraySchemaField: CustomArraySchemaField,
};

const schema: RJSFSchema = {
  type: 'string',
};

render(<Form schema={schema} validator={validator} fields={fields} />, document.getElementById('app'));
```
