# Custom Widgets and Fields

The API allows to specify your own custom _widget_ and _field_ components:

- A _widget_ represents a HTML tag for the user to enter data, eg. `input`, `select`, etc.
- A _field_ usually wraps one or more widgets and most often handles internal field state; think of a field as a form row, including the labels.

## Customizing the default fields and widgets

You can override any default field and widget, including the internal widgets like the `CheckboxWidget` that `BooleanField`
renders for boolean values. You can override any field and widget just by providing the customized fields/widgets in the
`fields` and `widgets` props:

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
  document.getElementById('app'),
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
- `LayoutGridField`
- `LayoutMultiSchemaField`
- `LayoutHeaderField`
- `NullField`
- `NumberField`
- `ObjectField`
- `SchemaField`
- `StringField`
- `TitleField`
- `UnsupportedField`
- `FallbackField`
- `CyclicSchemaField`

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

## Raising errors from within a custom widget or field

You can raise custom 'live validation' errors by overriding the `onChange` method to provide feedback while users are actively changing the form data.
If you do set errors this way, you must also clear them this way by passing `undefined` to the `onChange()` for the `errorSchema` parameter.
That clears the errors at the widget's or field's own path. A field that raised errors for paths below its own clears those too by passing `{}`.

Pass only the errors your widget or field raises itself. The `errorSchema` prop a field receives also holds the validator's errors and the form's `extraErrors`, so passing it back would claim those as the field's own, and they would stay on display after the validator or the parent stopped reporting them.
While a field raises errors, the validator's own errors at and below its path are off the display until the form validates again.

:::warning

While these errors are retained during validation, it is still preferred for you to use the [`customValidate` Form prop](../api-reference/form-props.md#customvalidate) mechanism instead.

:::

```tsx
import { ErrorSchema, RJSFSchema, UiSchema, WidgetProps, RegistryWidgetsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'text',
  default: 'hello',
};

const uiSchema: UiSchema = {
  'ui:widget': 'text',
};

const CustomTextWidget = function (props: WidgetProps) {
  const { id, value } = props;
  const raiseErrorOnChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    let raiseError: ErrorSchema | undefined;
    if (value !== 'test') {
      raiseError = {
        __errors: ['Value must be "test"'],
      };
    }
    props.onChange(value, raiseError, id);
  };

  return <input id={id} onChange={raiseErrorOnChange} value={value || ''} />;
};

const widgets: RegistryWidgetsType = {
  TextWidget: CustomTextWidget,
};

render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} widgets={widgets} />,
  document.getElementById('app'),
);
```

This creates a custom text widget that raises an error if the input value does not match 'test'.

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
- `required`: The required status of this widget. A widget its theme declares `uncheckedIsFalse`, as `@rjsf/core` declares `CheckboxWidget`, is required only where the schema demands `true` when its field renders a `boolean`, since left alone it then holds the `false` `getDefaultFormState()` seeds a required `boolean` with, which the schema accepts. Rendered as another type, as a `type` list's string field renders a switch, it answers nothing unchecked, so it is required as any other widget is;
- `disabled`: A boolean value stating if the widget is disabled;
- `readonly`: A boolean value stating if the widget is read-only;
- `autofocus`: A boolean value stating if the widget should autofocus;
- `label`: The computed label for this widget, as a string
- `hideLabel`: A boolean value, if true, tells the widget not to draw its label, because the field's plan has the template, or a field above rendering the same id, draw it, or `label` in the `UiSchema` turns it off. A widget that draws its own description should take it from [`getWidgetDescription()`](../api-reference/utility-functions.md#getwidgetdescription) rather than decide from `hideLabel`. Deprecated, and kept through v7 for a widget rendered without a plan: read `presentation.label.by === 'self'`, or [`widgetDrawsLabel()`](../api-reference/utility-functions.md#widgetdrawslabel), which falls back to `hideLabel` without a plan, instead;
- `multiple`: A boolean value stating if the widget can accept multiple values;
- `onChange`: The value change event handler; call it with the new value every time it changes;
- `onKeyChange`: The key change event handler (only called for fields with `additionalProperties`); pass the new value every time it changes;
- `onBlur`: The input blur event handler; call it with the widget id and value;
- `onFocus`: The input focus event handler; call it with the widget id and value;
- `options`: A map of options passed as a prop to the component (see [Custom widget options](#custom-widget-options)).
- `options.enumOptions`: For enum fields, this property contains the list of options for the enum as an array of \{ label, value } objects. If the enum is defined using the oneOf/anyOf syntax, the entire schema object for each option is appended onto the \{ schema, label, value } object.
- `rawErrors`: An array of strings listing all generated error messages from encountered errors for this widget. It carries them whatever `hideError` says, so that a widget can render them its own way. Deprecated, and kept through v7 for a widget rendered without a plan: read [`hasWidgetErrors()`](../api-reference/utility-functions.md#haswidgeterrors), which follows the `aria-invalid` the plan gives `presentation.control`, for the widget's error state instead;
- `presentation`: The plan of the field the widget renders the value of, handed on by a field that leaves its parts to the widget: whether the widget draws the label and description itself, and the attributes its control carries. Undefined for a widget rendered without a `SchemaField` above it, or by a field that draws its parts itself. See [`resolveFieldPresentation()`](../api-reference/utility-functions.md#resolvefieldpresentation).
- `hideError`: A boolean value stating if the widget is hiding its errors, set by the [`ui:hideError`](../api-reference/uiSchema.md#hideerror) uiSchema directive.
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
  document.getElementById('app'),
);
```

This is useful if you expose the `uiSchema` as pure JSON, which can't carry functions.

### Custom widget options

If you need to pass options to your custom widget, you can add a `ui:options` object containing those properties.
To provide defaults for options that aren't set via `ui:options`, apply them inside the widget itself:

```tsx
import { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

function MyCustomWidget(props: WidgetProps) {
  const { options } = props;
  const { color = 'red', backgroundColor } = options;
  return <input style={{ color, backgroundColor }} />;
}

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

### Customizing widgets' text input

All the widgets that render a text input use the `BaseInputTemplate` component internally. If you need to customize all text inputs without customizing all widgets individually, you can provide a `BaseInputTemplate` component in the `templates` property of `Form` (see [Custom Templates](./custom-templates.md#baseinputtemplate)).

### Wrapping an existing widget to customize it

Sometimes you just need to customize the properties that are passed to an existing widget.
The way to do this varies based upon whether you are using core or some other theme (such as mui).

Here is an example of modifying the `SelectWidget` to change the ordering of `enumOptions`:

```tsx
import { WidgetProps } from '@rjsf/utils';
import { SelectWidget } from '@rjsf/core'; // or from a theme: `const { SelectWidget } = Widgets` with `import { Widgets } from '@rjsf/mui'`

import myOptionsOrderFunction from './myOptionsOrderFunction';

function MySelectWidget(props: WidgetProps) {
  const { options } = props;
  let { enumOptions } = options;
  // Reorder the `enumOptions` however you want
  enumOptions = myOptionsOrderFunction(enumOptions);
  return <SelectWidget {...props} options={{ ...options, enumOptions }} />;
}
```

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

interface GeoData {
  lat?: number;
  lon?: number;
}

// Define a custom component for handling the root position object
class GeoPosition extends React.Component<FieldProps<GeoData>, GeoData> {
  constructor(props: FieldProps<GeoData>) {
    super(props);
    this.state = { ...props.formData };
  }

  onChange(name) {
    return (event) => {
      this.setState(
        {
          [name]: parseFloat(event.target.value),
        },
        () => this.props.onChange(this.state),
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
  document.getElementById('app'),
);
```

> Note: Registered fields can be reused across the entire schema.

A custom field draws its own label and description: the `FieldTemplate` around it draws neither, whether it is named by `ui:field`, `ui:options.field` or a schema's `$id`.
A field that wants the template to draw them, as `geo` above would to show its title, declares so under the key it is registered by, through the `Form`'s or the theme's [`presentation`](../api-reference/form-props.md#presentation).
Declare a template label under the field's own key rather than through `fieldDefault`: that also reaches objects and arrays, which have no control for the template's label to name, so they would draw no heading at all:

```tsx
<Form
  schema={schema}
  uiSchema={uiSchema}
  validator={validator}
  fields={fields}
  presentation={{ fields: { geo: { label: 'template', description: 'template' } } }}
/>
```

### Field props

A field component will always be passed the following props:

- `schema`: The JSON subschema object for this field;
- `uiSchema`: The [uiSchema](../api-reference/uiSchema.md) for this field;
- `fieldPath`: The `FieldPath` string identifying where this field's data lives, such as `friends[0].firstName`; pass it to `onChange` when reporting a new value
- `id`: The id of the field in the hierarchy
- `formData`: The data for this field;
- `errorSchema`: The tree of errors for this field and its children;
- `registry`: A [registry](#the-registry-object) object (read next).
- `required`: The required status of this field;
- `disabled`: A boolean value stating if the field is disabled;
- `readonly`: A boolean value stating if the field is read-only;
- `autofocus`: A boolean value stating if the field should autofocus;
- `name`: The unique name of the field, usually derived from the name of the property in the JSONSchema
- `rawErrors`: An array of strings listing the field's own error messages, which `errorSchema` doesn't hold. It carries them whatever `hideError` says, so that a field can render them its own way. It is unset for a field rendered beside a `oneOf`/`anyOf` option selector, which is given the errors instead. A custom `ArraySchemaField` is the exception: each item is handed the array's own errors and no plan, so it reads its own from its `errorSchema` rather than through [`getErrorsToDraw()`](../api-reference/utility-functions.md#geterrorstodraw), which would give it the array's. Deprecated, and kept through v7 for a field rendered without a plan: read [`getErrorsToDraw()`](../api-reference/utility-functions.md#geterrorstodraw) for the messages the field draws itself, the plan's `presentation.errors.messages`, with `ui:hideError` applied, where `presentation.errors.by` is `'self'`, since the template draws them under `'template'`, and `presentation.errors.messages.length > 0` for an error state, instead. Beside an option selector, where `rawErrors` is unset, `presentation.errors.messages` keeps the field's errors, which its template draws, so the field shows as invalid along with the selector;
- `presentation`: The plan `SchemaField` built for the field: who draws its label, description, help and errors, under which ids, and the attributes its control carries. Its `'self'` is the field's, so pass it to a widget the field renders only when the field leaves its parts to that widget, as one declaring `WIDGET_FIELD_PRESENTATION` does; a widget reads `'self'` as its own, so a field that draws its label and spreads its props into a widget would see the label drawn twice. See [`resolveFieldPresentation()`](../api-reference/utility-functions.md#resolvefieldpresentation).
- `hideError`: A boolean value stating if the field is hiding its errors, set by the [`ui:hideError`](../api-reference/uiSchema.md#hideerror) uiSchema directive
- `onChange`: The field change event handler; called with the updated field value, the `FieldPath` of the value (the root of the form is `''`), an optional ErrorSchema holding the errors the field itself raises (not the `errorSchema` prop) and the optional id of the field being changed
- `onBlur`: The input blur event handler; call it with the field id and value;
- `onFocus`: The input focus event handler; call it with the field id and value;

`SchemaField` sets one more prop, and only for `AnyOfField` and `OneOfField`, the fields that render a `oneOf`/`anyOf` option selector. Both pass their props on to the field of the selected option, so that field receives the union's `options` too, and its presence does not tell a field that it renders a union:

- `options`: The option schemas, each already retrieved for the field's `formData` by `SchemaField`. A custom field that renders `AnyOfField` or `OneOfField` itself retrieves them the same way, reading a boolean option as an empty schema:

  ```tsx
  const options = (schema.anyOf ?? []).map((option) =>
    registry.schemaUtils.retrieveSchema(typeof option === 'object' ? option : {}, formData),
  );
  ```

The option a union field shows is the form's state, not the field's: `SchemaField` reads it too, to stub the extra keys of an object once, with the selected option, and it outlives the field's components and follows the moves the form makes, of array items and of additional properties renamed or removed.
A custom `AnyOfField` or `OneOfField` reads and writes it with `useOptionSelection()` from `@rjsf/core`, rather than keeping its own, and sends the data for a newly selected option through `onChange` as before:

```tsx
import { useOptionSelection } from '@rjsf/core';

function MyAnyOfField(props: FieldProps & { options: RJSFSchema[] }) {
  const { fieldPath, formData, options, registry, schema } = props;
  const { selectedOption, selectOption } = useOptionSelection(
    registry,
    fieldPath,
    options,
    formData,
    getDiscriminatorFieldFromSchema(schema),
  );
  // render the selector on `selectedOption`; on a pick, `selectOption(index)` and then `onChange(newData, fieldPath)`
}
```

With no selection, the option shown is the one `getClosestMatchingOption()` picks for the data.
A selection holds for the data the form last rendered under it and for the data the form's own changes inside the option leave at the field, whatever those edits made of it, so a switch or an edit `transformChange` refuses keeps it too.
Other data, such as `setFieldValue()`'s, a reset, a parent field answering a switch with data of its own, or an edit to a property the object declares beside its options that the options can disagree about, one an option names under `properties`, such as with a `const` that tells the options apart, or under `required`, or any such property where an option carries a keyword that reads the object whole, such as `minProperties`, `not` or `additionalProperties`, is shown under the option `getClosestMatchingOption()` picks for it, the selection winning a tie, even when it is the data the field showed before the switch; that pick does not replace the selection.
An edit to a property every option is silent about, where each carries only `type`, annotations such as `title`, and `properties` and `required` that leave the property out, holds the option shown, as an edit inside the option does.
Outside a `Form`, the outermost `SchemaField` keeps the selections of the fields below it, and a component with no `SchemaField` or `Form` above it keeps its own.
The selection is kept by the place of the option list in the root schema, so a condition that swaps the list the field offers starts the choice over and finds it again when it swaps back, while a schema that changes the list in place, such as by adding an option, keeps it.

## The `registry` object

The `registry` is an object containing the registered core, theme and custom fields and widgets as well as the root schema, form context, schema utils.

- `fields`: The set of all fields used by the `Form`. Includes fields from `core`, theme-specific fields and any [custom registered fields](#custom-field-components);
- `widgets`: The set of all widgets used by the `Form`. Includes widgets from `core`, theme-specific widgets and any [custom registered widgets](#custom-component-registration), if any;
- `templates`: The set of templates used by the `Form`. Includes templates from `core`, theme-specific templates and any custom registered templates
- `rootSchema`: The root schema, as passed to the `Form`, which can contain referenced [definitions](../json-schema/definitions.md);
- `schemaUtils`: The current implementation of the `SchemaUtilsType` (from `@rjsf/utils`) in use by the `Form`. Used to call any of the validation-schema-based utility functions.
- `translateString`: The string translation function to use when displaying any of the RJSF strings in templates, fields or widgets
- `globalFormOptions`: The global Form Options that are available for all templates, fields and widgets to access
- `globalUiOptions`: The optional global UI Options that are available for all templates, fields and widgets to access

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

### Custom Field by Id

**Warning:** This is a powerful feature as you can override the whole form behavior and easily mess it up. Handle with care.

You can provide your own implementation of the field component that applies to any schema or sub-schema based on the schema's `$id` value. This is useful when your custom field should be conditionally applied based on the schema rather than the property name or data type.

To provide a custom field in this way, the `fields` prop should be an object which contains a key that matches the `$id` value of the schema which should have a custom field; here's an example:

```tsx
import { RJSFSchema, FieldProps, RegistryFieldsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const CustomIdField = function (props: FieldProps) {
  return (
    <div id='custom'>
      <p>Yeah, I'm pretty dumb.</p>
      <div>My props are: {JSON.stringify(props)}</div>
    </div>
  );
};

const fields: RegistryFieldsType = {
  '/schemas/my-id': CustomIdField,
};

const schema: RJSFSchema = {
  $id: '/schemas/my-id',
  type: 'string',
};

render(<Form schema={schema} validator={validator} fields={fields} />, document.getElementById('app'));
```

A `$id` names the field the way [`ui:field`](../api-reference/uiSchema.md#uifield) does, after the field's own `ui:field`: the field renders beside an `anyOf`/`oneOf` option selector, or in place of the options with `ui:fieldReplacesAnyOrOneOf`.
A named field is applied once per data path, so one that renders `registry.fields.SchemaField` for its own data gets the default field for the schema there, whatever the `uiSchema` it passes names. That field draws the label, description and help the named field's [`presentation`](../api-reference/form-props.md#presentation) plan hands down to it, and the extra key's input and remove button and the option selector stay with the field's own `SchemaField`, so each renders once. Naming `SchemaField` or `FallbackField` names no custom field: `SchemaField` renders as though no field were named, and `FallbackField` as it does when the schema's type picks it.

### Wrapping an existing field to customize it

Sometimes you just need to customize the properties that are passed to an existing field.

Here is an example of wrapping the `ObjectField` to tweak the `onChange` handler to look for a specific kind of bad data:

```tsx
import { useCallback } from 'react';
import { FieldProps } from '@rjsf/utils';
import { ObjectField } from '@rjsf/core';

import checkBadData from './checkBadData';

function MyObjectField(props: FieldProps) {
  const { onChange } = props;
  const onChangeHandler = useCallback(
    (newFormData: T | undefined, path: (number | string)[], es?: ErrorSchema<T>, id?: string) => {
      let data = newFormData;
      let error = es;
      if (checkBadData(newFormData)) {
        // Format the `error` and fix the `data` here
      }
      onChange(data, path, error, id);
    },
    [onChange],
  );
  return <ObjectField {...props} onChange={onChangeHandler} />;
}
```

A wrapper registered under the key of the field it wraps, as `fields={{ ObjectField: MyObjectField }}`, keeps that key's [`presentation`](../api-reference/form-props.md#presentation) declaration, so it is labelled as the field it wraps.
One registered under a key of its own, or given as `ui:field` directly, is a custom field, which draws its own label: a wrapper around `StringField` in a theme whose template draws the label declares `{ label: 'template', description: 'template' }` under its key, so the field it renders is labelled as before.

Pass the `formData` through unchanged. `ArrayField` and `ObjectField` add, remove, rename and reorder by reading the form's current value at their `fieldPath`, not the `formData` they were rendered with, so that several edits in one event build on each other. A wrapper that hands them a transformed view of the data, such as a sorted copy, makes those operations act on positions the form does not hold.
