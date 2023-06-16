# Custom Templates

This is an advanced feature that lets you customize even more aspects of the form:

|                       | Custom Field                              | Custom Template                                                | Custom Widget                                                             |
| --------------------- | ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **What it does**      | Overrides all behaviour                   | Overrides just the layout (not behaviour)                      | Overrides just the input box (not layout, labels, or help, or validation) |
| **Usage**             | Global or per-field                       | Global or per-field                                            | Global or per-field                                                       |
| **Global Example**    | `<Form fields={{ MyCustomField }} />`     | `<Form templates={{ ArrayFieldTemplate: MyArrayTemplate }} />` | `<Form widgets={{ MyCustomWidget }} />`                                   |
| **Per-Field Example** | `"ui:field": MyCustomField`               | `"ui:ArrayFieldTemplate": MyArrayTemplate`                     | `"ui:widget":MyCustomWidget`                                              |
| **Documentation**     | [Custom Fields](custom-widgets-fields.md) | See documentation below                                        | [Custom Widgets](custom-widgets-fields.md)                                |

In version 5, all existing `templates` were consolidated into a new `TemplatesType` interface that is provided as part of the `Registry`.
They can also be overloaded globally on the `Form` via the `templates` prop as well as globally or per-field through the `uiSchema`.
Further, many new templates were added or repurposed from existing `widgets` and `fields` in an effort to simplify the effort needed by theme authors to build new and/or maintain current themes.
These new templates can also be overridden by individual users to customize the specific needs of their application.
A special category of templates, `ButtonTemplates`, were also added to support the easy replacement of the `Submit` button on the form, the `Add` and `Remove` buttons associated with `additionalProperties` on objects and elements of arrays, as well as the `Move up` and `Move down` buttons used for reordering arrays.
This category, unlike the others, can only be overridden globally via the `templates` prop on `Form`.

Below is the table that lists all the `templates`, their props interface, their `uiSchema` name and from where they originated in the previous version of RJSF:

| Template\*                                                        | Props Type                    | UiSchema name                    | Origin                                                                                                                                                       |
| ----------------------------------------------------------------- | ----------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ArrayFieldTemplate](#arrayfieldtemplate)                         | ArrayFieldTemplateProps       | ui:ArrayFieldTemplate            | Formerly `Form.ArrayFieldTemplate` or `Registry.ArrayFieldTemplate`                                                                                          |
| [ArrayFieldDescriptionTemplate\*](#arrayfielddescriptiontemplate) | ArrayFieldDescriptionProps    | ui:ArrayFieldDescriptionTemplate | Formerly part of `@rjsf/core` ArrayField, refactored as a template, used in all `ArrayFieldTemplate` implementations                                         |
| [ArrayFieldItemTemplate\*](#arrayfielditemtemplate)               | ArrayFieldTemplateItemType    | ui:ArrayFieldItemTemplate        | Formerly an internal class for `ArrayFieldTemplate`s in all themes, refactored as a template in each theme, used in all `ArrayFieldTemplate` implementations |
| [ArrayFieldTitleTemplate\*](#arrayfieldtitletemplate)             | ArrayFieldTitleProps          | ui:ArrayFieldTitleTemplate       | Formerly part of `@rjsf/core` ArrayField, refactored as a template, used in all `ArrayFieldTemplate` implementations.                                        |
| [BaseInputTemplate\*](#baseinputtemplate)                         | WidgetProps                   | ui:BaseInputTemplate             | Formerly a `widget` in `@rjsf.core` moved to `templates` and newly implemented in each theme to maximize code reuse.                                         |
| [DescriptionFieldTemplate\*](#descriptionfieldtemplate)           | DescriptionFieldProps         | ui:DescriptionFieldTemplate      | Formerly a `field` in `@rjsf.core` moved to `templates` with the `Template` suffix. Previously implemented in each theme.                                    |
| [ErrorListTemplate\*](#errorlisttemplate)                         | ErrorListProps                | ui:ErrorListTemplate             | Formerly `Form.ErrorList` moved to `templates` with the `Templates` suffix. Previously implemented in each theme.                                            |
| [FieldErrorTemplate\*](#fielderrortemplate)                       | FieldErrorProps               | ui:FieldErrorTemplate            | Formerly internal `ErrorList` component accessible only to `SchemaField`                                                                                     |
| [FieldHelpTemplate\*](#fieldhelptemplate)                         | FieldHelpProps                | ui:FieldHelpTemplate             | Formerly internal `Help` component accessible only to `SchemaField`                                                                                          |
| [FieldTemplate](#fieldtemplate)                                   | FieldTemplateProps            | ui:FieldTemplate                 | Formerly `Form.FieldTemplate` or `Registry.FieldTemplate`                                                                                                    |
| [ObjectFieldTemplate](#objectfieldtemplate)                       | ObjectFieldTemplateProps      | ui:ObjectFieldTemplate           | Formerly `Form.ObjectFieldTemplate` or `Registry.ObjectFieldTemplate`                                                                                        |
| [TitleFieldTemplate\*](#titlefieldtemplate)                       | TitleFieldProps               | ui:TitleFieldTemplate            | Formerly a `field` in `@rjsf.core` moved to `templates` with the `Template` suffix. Previously implemented in each theme.                                    |
| [UnsupportedFieldTemplate\*](#unsupportedfieldtemplate)           | UnsupportedFieldProps         | ui:UnsupportedFieldTemplate      | Formerly a `field` in `@rjsf.core` moved to `templates` with the `Template` suffix.                                                                          |
| [WrapIfAdditionalTemplate\*](#wrapifadditionaltemplate)           | WrapIfAdditionalTemplateProps | ui:WrapIfAdditionalTemplate      | Formerly an internal component in `@rjsf.core`. Previously implemented in most themes.                                                                       |
| [ButtonTemplates.AddButton\*](#addbutton)                         | IconButtonProps               | n/a                              | Formerly an internal implementation in each theme                                                                                                            |
| [ButtonTemplates.MoveDownButton\*](#movedownbutton)               | IconButtonProps               | n/a                              | Formerly an internal implementation in each theme                                                                                                            |
| [ButtonTemplates.MoveUpButton\*](#moveupbutton)                   | IconButtonProps               | n/a                              | Formerly an internal implementation in each theme                                                                                                            |
| [ButtonTemplates.RemoveButton\*](#removebutton)                   | IconButtonProps               | n/a                              | Formerly an internal implementation in each theme                                                                                                            |
| [ButtonTemplates.SubmitButton\*](#submitbutton)                   | SubmitButtonProps             | n/a                              | Formerly a `field` in each theme move to `templates.ButtonTemplates`                                                                                         |

\* indicates a new template in version 5

## ArrayFieldTemplate

You can use an `ArrayFieldTemplate` to customize how your arrays are rendered.
This allows you to customize your array, and each element in the array.
If you only want to customize how the array's title, description or how the array items are presented, you may want to consider providing your own [ArrayFieldDescriptionTemplate](#arrayfielddescriptiontemplate), [ArrayFieldItemTemplate](#arrayfielditemtemplate) and/or [ArrayFieldTitleTemplate](#arrayfieldtitletemplate) instead.
You can also customize arrays by specifying a widget in the relevant `ui:widget` schema, more details over on [Custom Widgets](../usage/arrays.md#custom-widgets).

```tsx
import { ArrayFieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  return (
    <div>
      {props.items.map((element) => element.children)}
      {props.canAdd && <button type='button' onClick={props.onAddClick}></button>}
    </div>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ ArrayFieldTemplate }} />,
  document.getElementById('app')
);
```

You also can provide your own field template to a uiSchema by specifying a `ui:ArrayFieldTemplate` property.

```tsx
import { UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:ArrayFieldTemplate': ArrayFieldTemplate,
};
```

Please see the [customArray.tsx sample](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/playground/src/samples/customArray.tsx) from the [playground](https://rjsf-team.github.io/react-jsonschema-form/) for another example.

The following props are passed to each `ArrayFieldTemplate`:

- `canAdd`: A boolean value stating whether new elements can be added to the array.
- `className`: The className string.
- `disabled`: A boolean value stating if the array is disabled.
- `idSchema`: An object containing the id for this object & ids for its properties
- `items`: An array of objects representing the items in the array. Each of the items represent a child with properties described below.
- `onAddClick: (event?) => void`: A function that adds a new item to the array.
- `readonly`: A boolean value stating if the array is read-only.
- `required`: A boolean value stating if the array is required.
- `hideError`: A boolean value stating if the field is hiding its errors.
- `schema`: The schema object for this array.
- `uiSchema`: The uiSchema object for this array field.
- `title`: A string value containing the title for the array.
- `formContext`: The `formContext` object that you passed to Form.
- `formData`: The formData for this array.
- `rawErrors`: An array of strings listing all generated error messages from encountered errors for this widget
- `registry`: The `registry` object.

The following props are part of each element in `items`:

- `children`: The html for the item's content.
- `className`: The className string.
- `disabled`: A boolean value stating if the array item is disabled.
- `hasCopy`: A boolean value stating whether the array item can be copied.
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
- `uiSchema`: The uiSchema object for this array item.
- `registry`: The `registry` object.

> Note: Array and object field templates are always rendered inside the FieldTemplate. To fully customize an array field template, you may need to specify both `ui:FieldTemplate` and `ui:ArrayFieldTemplate`.

## ArrayFieldDescriptionTemplate

The out-of-the-box version of this template will render the `DescriptionFieldTemplate` with a generated id, if there is a `description` otherwise nothing is rendered.
If you want different behavior for the rendering of the description of an array field, you can customize this template.
If you want a different behavior for the rendering of ALL descriptions in the `Form`, see [DescriptionFieldTemplate](#descriptionfieldtemplate)

```tsx
import { ArrayFieldDescriptionProps, RJSFSchema, descriptionId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

function ArrayFieldDescriptionTemplate(props: ArrayFieldDescriptionProps) {
  const { description, idSchema } = props;
  const id = descriptionId(idSchema);
  return (
    <details id={id}>
      <summary>Description</summary>
      {description}
    </details>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ ArrayFieldDescriptionTemplate }} />,
  document.getElementById('app')
);
```

You also can provide your own template to a uiSchema by specifying a `ui:ArrayFieldDescriptionTemplate` property.

```tsx
import { UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:ArrayFieldDescriptionTemplate': ArrayFieldDescriptionTemplate,
};
```

The following props are passed to each `ArrayFieldDescriptionTemplate`:

- `description`: The description of the array field being rendered.
- `idSchema`: The idSchema of the array field in the hierarchy.
- `schema`: The schema object for this array field.
- `uiSchema`: The uiSchema object for this array field.
- `registry`: The `registry` object.

## ArrayFieldItemTemplate

The `ArrayFieldItemTemplate` is used to render the representation of a single item in an array.
All of the `ArrayFieldTemplate` implementations in all themes get this template from the `registry` in order to render array fields items.
Each theme has an implementation of the `ArrayFieldItemTemplate` to render an array field item in a manner best suited to the theme.
If you want to change how an array field item is rendered you can customize this template (for instance to remove the move up/down and remove buttons).

```tsx
import { ArrayFieldTemplateItemType, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

function ArrayFieldItemTemplate(props: ArrayFieldTemplateItemType) {
  const { children, className } = props;
  return <div className={className}>{children}</div>;
}

render(
  <Form schema={schema} validator={validator} templates={{ ArrayFieldItemTemplate }} />,
  document.getElementById('app')
);
```

The following props are passed to each `ArrayFieldItemTemplate`:

- `children`: The html for the item's content.
- `className`: The className string.
- `disabled`: A boolean value stating if the array item is disabled.
- `canAdd`: A boolean value stating whether new items can be added to the array.
- `hasCopy`: A boolean value stating whether the array item can be copied.
- `hasMoveDown`: A boolean value stating whether the array item can be moved down.
- `hasMoveUp`: A boolean value stating whether the array item can be moved up.
- `hasRemove`: A boolean value stating whether the array item can be removed.
- `hasToolbar`: A boolean value stating whether the array item has a toolbar.
- `index`: A number stating the index the array item occurs in `items`.
- `totalItems`: A number stating the total number `items` in the array.
- `key`: A stable, unique key for the array item.
- `onAddIndexClick: (index) => (event?) => void`: Returns a function that adds a new item at `index`.
- `onDropIndexClick: (index) => (event?) => void`: Returns a function that removes the item at `index`.
- `onReorderClick: (index, newIndex) => (event?) => void`: Returns a function that swaps the items at `index` with `newIndex`.
- `readonly`: A boolean value stating if the array item is read-only.
- `schema`: The schema object for this array item.
- `uiSchema`: The uiSchema object for this array item.
- `registry`: The `registry` object.

## ArrayFieldTitleTemplate

The out-of-the-box version of this template will render the `TitleFieldTemplate` with a generated id, if there is a `title` otherwise nothing is rendered.
If you want a different behavior for the rendering of the title of an array field, you can customize this template.
If you want a different behavior for the rendering of ALL titles in the `Form`, see [TitleFieldTemplate](#titlefieldtemplate)

```tsx
import { ArrayFieldTitleTemplateProps, RJSFSchema, titleId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

function ArrayFieldTitleTemplate(props: ArrayFieldTitleProps) {
  const { title, idSchema } = props;
  const id = titleId(idSchema);
  return <h1 id={id}>{title}</h1>;
}

render(
  <Form schema={schema} validator={validator} templates={{ ArrayFieldTitleTemplate }} />,
  document.getElementById('app')
);
```

You also can provide your own template to a uiSchema by specifying a `ui:ArrayFieldDescriptionTemplate` property.

```tsx
import { UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:ArrayFieldTitleTemplate': ArrayFieldTitleTemplate,
};
```

The following props are passed to each `ArrayFieldTitleTemplate`:

- `title`: The title of the array field being rendered.
- `idSchema`: The idSchema of the array field in the hierarchy.
- `schema`: The schema object for this array field.
- `uiSchema`: The uiSchema object for this array field.
- `required`: A boolean value stating if the field is required
- `registry`: The `registry` object.

## BaseInputTemplate

The `BaseInputTemplate` is the template to use to render the basic `<input>` component for a theme.
It is used as the template for rendering many of the `<input>` based widgets that differ by `type` and callbacks only.
For example, the `TextWidget` implementation in `core` is simply a wrapper around `BaseInputTemplate` that it gets from the `registry`.
Additionally, each theme implements its own version of `BaseInputTemplate` without needing to provide a different implementation of `TextWidget`.

If you desire a different implementation for the `<input>` based widgets, you can customize this template.
For instance, say you have a `CustomTextInput` component that you want to integrate:

```tsx
import { ChangeEvent, FocusEvent } from 'react';
import { getInputProps, RJSFSchema, BaseInputTemplateProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import CustomTextInput from '../CustomTextInput';

const schema: RJSFSchema = {
  type: 'string',
  title: 'My input',
  description: 'input description',
};

function BaseInputTemplate(props: BaseInputTemplateProps) {
  const {
    schema,
    id,
    options,
    label,
    value,
    type,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    rawErrors,
    hideError,
    uiSchema,
    registry,
    formContext,
    ...rest
  } = props;
  const onTextChange = ({ target: { value: val } }: ChangeEvent<HTMLInputElement>) => {
    // Use the options.emptyValue if it is specified and newVal is also an empty string
    onChange(val === '' ? options.emptyValue || '' : val);
  };
  const onTextBlur = ({ target: { value: val } }: FocusEvent<HTMLInputElement>) => onBlur(id, val);
  const onTextFocus = ({ target: { value: val } }: FocusEvent<HTMLInputElement>) => onFocus(id, val);

  const inputProps = { ...rest, ...getInputProps(schema, type, options) };
  const hasError = rawErrors.length > 0 && !hideError;

  return (
    <CustomTextInput
      id={id}
      label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      error={hasError}
      errors={hasError ? rawErrors : undefined}
      onChange={onChangeOverride || onTextChange}
      onBlur={onTextBlur}
      onFocus={onTextFocus}
      {...inputProps}
    />
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ BaseInputTemplate }} />,
  document.getElementById('app')
);
```

Sometimes you just need to pass some additional properties to the existing `BaseInputTemplate`.
The way to do this varies based upon whether you are using `core` or some other theme (such as `mui`):

```tsx
import { BaseInputTemplateProps } from '@rjsf/utils';
import { getDefaultRegistry } from '@rjsf/core';
import { Templates } from '@rjsf/mui';

const { templates: { BaseInputTemplate } } = getDefaultRegistry();  // To get templates from core
// const { BaseInputTemplate } = Templates; // To get templates from a theme do this

function MyBaseInputTemplate(props: BaseInputTemplateProps)
{
  const customProps = {};
  // get your custom props from where you need to
  return <BaseInputTemplate {...props} {...customProps} />;
}
```

The following props are passed to the `BaseInputTemplate`:

- `id`: The generated id for this widget;
- `schema`: The JSONSchema subschema object for this widget;
- `uiSchema`: The uiSchema for this widget;
- `value`: The current value for this widget;
- `placeholder`: The placeholder for the widget, if any;
- `required`: The required status of this widget;
- `disabled`: A boolean value stating if the widget is disabled;
- `hideError`: A boolean value stating if the widget is hiding its errors.
- `readonly`: A boolean value stating if the widget is read-only;
- `autofocus`: A boolean value stating if the widget should autofocus;
- `label`: The computed label for this widget, as a string
- `multiple`: A boolean value stating if the widget can accept multiple values;
- `onChange`: The value change event handler; call it with the new value every time it changes;
- `onChangeOverride`: A `BaseInputTemplate` implements a default `onChange` handler that it passes to the HTML input component to handle the `ChangeEvent`. Sometimes a widget may need to handle the `ChangeEvent` using custom logic. If that is the case, that widget should provide its own handler via this prop;
- `onKeyChange`: The key change event handler (only called for fields with `additionalProperties`); pass the new value every time it changes;
- `onBlur`: The input blur event handler; call it with the widget id and value;
- `onFocus`: The input focus event handler; call it with the widget id and value;
- `options`: A map of options passed as a prop to the component (see [Custom widget options](./custom-widgets-fields.md#custom-widget-options)).
- `options.enumOptions`: For enum fields, this property contains the list of options for the enum as an array of { label, value } objects. If the enum is defined using the oneOf/anyOf syntax, the entire schema object for each option is appended onto the { schema, label, value } object.
- `formContext`: The `formContext` object that you passed to `Form`.
- `rawErrors`: An array of strings listing all generated error messages from encountered errors for this widget.
- `registry`: The `registry` object

## DescriptionFieldTemplate

Each theme implements a `DescriptionFieldTemplate` used to render the description of a field.
If you want to customize how descriptions are rendered you can.

```tsx
import { DescriptionFieldProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
  title: 'My input',
  description: 'input description',
};

function DescriptionFieldTemplate(props: DescriptionFieldProps) {
  const { description, id } = props;
  return (
    <details id={id}>
      <summary>Description</summary>
      {description}
    </details>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ DescriptionFieldTemplate }} />,
  document.getElementById('app')
);
```

The following props are passed to the `DescriptionFieldTemplate`:

- `description`: The description of the field being rendered.
- `id`: The id of the field in the hierarchy.
- `schema`: The schema object for the field.
- `uiSchema`: The uiSchema object for the field.
- `registry`: The `registry` object.

## ErrorListTemplate

The `ErrorListTemplate` is the template that renders the all the errors associated with the fields in the `Form`, at the top.
Each theme implements a `ErrorListTemplate` used to render its errors using components for the theme's toolkit.
If you want to customize how all the errors are rendered you can.

```tsx
import { ErrorListProps, RJSFValidationError, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
  title: 'My input',
  description: 'input description',
};

function ErrorListTemplate(props: ErrorListProps) {
  const { errors } = props;
  return (
    <details id={id}>
      <summary>Errors</summary>
      <ul>
        {errors.map((error: RJSFValidationError, i: number) => {
          return (
            <li key={i} className='error'>
              {error.stack}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ DescriptionFieldTemplate }} />,
  document.getElementById('app')
);
```

The following props are passed to the `ErrorListTemplate`:

- `schema`: The schema that was passed to `Form`
- `uiSchema`: The uiSchema that was passed to `Form`
- `formContext`: The `formContext` object that you passed to `Form`.
- `errors`: An array of all errors in this `Form`.
- `errorSchema`: The `ErrorSchema` constructed by `Form`

## FieldErrorTemplate

The `FieldErrorTemplate` is the template that renders all the errors associated a single field.
If you want to customize how the errors are rendered you can.

```tsx
import { FieldErrorProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
  title: 'My input',
  description: 'input description',
};

function FieldErrorTemplate(props: FieldErrorProps) {
  const { errors } = props;
  return (
    <details id={id}>
      <summary>Errors</summary>
      <ul>
        {errors.map((error: string, i: number) => {
          return (
            <li key={i} className='error'>
              {error.stack}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ FieldErrorTemplate }} />,
  document.getElementById('app')
);
```

The following props are passed to the `FieldErrorTemplate`:

- `schema`: The schema for the field
- `uiSchema`: The uiSchema for the field
- `idSchema`: An object containing the id for this field & ids for its properties.
- `errors`: An array of all errors for this field
- `errorSchema`: The `ErrorSchema` for this field
- `registry`: The `Registry` object

## FieldHelpTemplate

The `FieldHelpTemplate` is the template that renders the help associated a single field.
If you want to customize how the help is rendered you can.

```tsx
import { FieldHelpProps, RJSFSchema, helpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
  title: 'My input',
  description: 'input description',
};

function FieldHelpTemplate(props: FieldHelpProps) {
  const { help, idSchema } = props;
  const id = helpId(idSchema);
  return <aside id={id}>{help}</aside>;
}

render(
  <Form schema={schema} validator={validator} templates={{ FieldHelpTemplate }} />,
  document.getElementById('app')
);
```

The following props are passed to the `FieldHelpTemplate`:

- `schema`: The schema for the field
- `uiSchema`: The uiSchema for the field
- `idSchema`: An object containing the id for this field & ids for its properties.
- `help`: The help information to be rendered
- `registry`: The `Registry` object

## FieldTemplate

To take control over the inner organization of each field (each form row), you can define a _field template_ for your form.

A field template is basically a React stateless component being passed field-related props, allowing you to structure your form row as you like.

```tsx
import { FieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

function CustomFieldTemplate(props: FieldTemplateProps) {
  const { id, classNames, style, label, help, required, description, errors, children } = props;
  return (
    <div className={classNames} style={style}>
      <label htmlFor={id}>
        {label}
        {required ? '*' : null}
      </label>
      {description}
      {children}
      {errors}
      {help}
    </div>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ FieldTemplate: CustomFieldTemplate }} />,
  document.getElementById('app')
);
```

You also can provide your own field template to a uiSchema by specifying a `ui:FieldTemplate` property.

```tsx
import { UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:FieldTemplate': CustomFieldTemplate,
};
```

If you want to handle the rendering of each element yourself, you can use the props `rawHelp`, `rawDescription` and `rawErrors`.

The following props are passed to a custom field template component:

- `id`: The id of the field in the hierarchy. You can use it to render a label targeting the wrapped widget.
- `classNames`: A string containing the base Bootstrap CSS classes, merged with any [custom ones](../api-reference/uiSchema.md#classnames) defined in your uiSchema.
- `style`: An object containing the `StyleHTMLAttributes` defined in the `uiSchema`.
- `label`: The computed label for this field, as a string.
- `description`: A component instance rendering the field description, if one is defined (this will use any [custom `DescriptionFieldTemplate`](#descriptionfieldtemplate) defined in the `templates` passed to the `Form`).
- `rawDescription`: A string containing any `ui:description` uiSchema directive defined.
- `children`: The field or widget component instance for this field row.
- `hideError`: A boolean value stating if the field is hiding its errors.
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
- `schema`: The schema object for this field.
- `uiSchema`: The uiSchema object for this field.
- `onChange`: The value change event handler; Can be called with a new value to change the value for this field.
- `formContext`: The `formContext` object that you passed to `Form`.
- `formData`: The formData for this field.
- `registry`: The `registry` object.

> Note: you can only define a single global field template for a form, but you can set individual field templates per property using `"ui:FieldTemplate"`.

## ObjectFieldTemplate

```tsx
import { ObjectFieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  title: 'Object title',
  description: 'Object description',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
};

function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  return (
    <div>
      {props.title}
      {props.description}
      {props.properties.map((element) => (
        <div className='property-wrapper'>{element.content}</div>
      ))}
    </div>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ ObjectFieldTemplate }} />,
  document.getElementById('app')
);
```

You also can provide your own field template to a uiSchema by specifying a `ui:ObjectFieldTemplate` property.

```tsx
import { UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:ObjectFieldTemplate': ObjectFieldTemplate,
};
```

Please see the [customObject.tsx sample](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/playground/src/samples/customObject.tsx) from the [playground](https://rjsf-team.github.io/react-jsonschema-form/) for a better example.

The following props are passed to each `ObjectFieldTemplate` as defined by the `ObjectFieldTemplateProps` in `@rjsf/utils`:

- `title`: A string value containing the title for the object.
- `description`: A string value containing the description for the object.
- `disabled`: A boolean value stating if the object is disabled.
- `properties`: An array of object representing the properties in the object. Each of the properties represent a child with properties described below.
- `onAddClick: (schema: RJSFSchema) => () => void`: Returns a function that adds a new property to the object (to be used with additionalProperties)
- `readonly`: A boolean value stating if the object is read-only.
- `required`: A boolean value stating if the object is required.
- `hideError`: A boolean value stating if the field is hiding its errors.
- `schema`: The schema object for this object.
- `uiSchema`: The uiSchema object for this object field.
- `idSchema`: An object containing the id for this object & ids for its properties.
- `errorSchema`: The optional validation errors in the form of an `ErrorSchema`
- `formData`: The form data for the object.
- `formContext`: The `formContext` object that you passed to Form.
- `registry`: The `registry` object.

The following props are part of each element in `properties`:

- `content`: The html for the property's content.
- `name`: A string representing the property name.
- `disabled`: A boolean value stating if the object property is disabled.
- `readonly`: A boolean value stating if the property is read-only.
- `hidden`: A boolean value stating if the property should be hidden.

> Note: Array and object field templates are always rendered inside the FieldTemplate. To fully customize an object field template, you may need to specify both `ui:FieldTemplate` and `ui:ObjectFieldTemplate`.

## TitleFieldTemplate

Each theme implements a `TitleFieldTemplate` used to render the title of a field.
If you want to customize how titles are rendered you can.

```tsx
import { RJSFSchema, TitleFieldProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
  title: 'My input',
  description: 'input description',
};

function TitleFieldTemplate(props: TitleFieldProps) {
  const { id, required, title } = props;
  return (
    <header id={id}>
      {title}
      {required && <mark>*</mark>}
    </header>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ TitleFieldTemplate }} />,
  document.getElementById('app')
);
```

The following props are passed to each `TitleFieldTemplate`:

- `id`: The id of the field in the hierarchy.
- `title`: The title of the field being rendered.
- `schema`: The schema object for the field.
- `uiSchema`: The uiSchema object for the field.
- `required`: A boolean value stating if the field is required
- `registry`: The `registry` object.

## UnsupportedFieldTemplate

The `UnsupportedField` component is used to render a field in the schema is one that is not supported by react-jsonschema-form.
If you want to customize how an unsupported field is rendered (perhaps for localization purposes) you can.

```tsx
import { RJSFSchema, UnsupportedFieldProps } from '@rjsf/utils';
import { FormattedMessage } from 'react-intl';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'invalid',
};

function UnsupportedFieldTemplate(props: UnsupportedFieldProps) {
  const { schema, reason } = props;
  return (
    <div>
      <FormattedMessage defaultMessage='Unsupported field schema, reason = {reason}' value={{ reason }} />
      <pre>{JSON.stringify(schema, null, 2)}</pre>
    </div>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ UnsupportedFieldTemplate }} />,
  document.getElementById('app')
);
```

The following props are passed to each `UnsupportedFieldTemplate`:

- `schema`: The schema object for this unsupported field.
- `idSchema`: An object containing the id for this unsupported field.
- `reason`: The reason why the schema field has an unsupported type.
- `registry`: The `registry` object.

## WrapIfAdditionalTemplate

The `WrapIfAdditionalTemplate` is used by the `FieldTemplate` to conditionally render additional controls if `additionalProperties` is present in the schema.
You may customize `WrapIfAdditionalTemplate` if you wish to change the layout or behavior of user-controlled `additionalProperties`.

```tsx
import { RJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  additionalProperties: true,
};

function WrapIfAdditionalTemplate(props: WrapIfAdditionalTemplateProps) {
  const { id, label, onKeyChange, onDropPropertyClick, schema, children, uiSchema, registry, classNames, style } =
    props;
  const { RemoveButton } = registry.templates.ButtonTemplates;
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return <div>{children}</div>;
  }

  return (
    <div className={classNames} style={style}>
      <label label={keyLabel} id={`${id}-key`}>
        Custom Field Key
      </label>
      <input
        className='form-control'
        type='text'
        id={`${id}-key`}
        onBlur={function (event) {
          onKeyChange(event.target.value);
        }}
        defaultValue={label}
      />
      <div>{children}</div>
      <RemoveButton onClick={onDropPropertyClick(label)} uiSchema={uiSchema} />
    </div>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ WrapIfAdditionalTemplate }} />,
  document.getElementById('app')
);
```

The following props are passed to the `WrapIfAdditionalTemplate`:

- `children`: The children of the component, typically specified by the `FieldTemplate`.

- `id`: The id of the field in the hierarchy. You can use it to render a label targeting the wrapped widget.
- `classNames`: A string containing the base Bootstrap CSS classes, merged with any [custom ones](../api-reference/uiSchema.md#classnames) defined in your uiSchema.
- `style`: An object containing the `StyleHTMLAttributes` defined in the `uiSchema`.
- `label`: The computed label for this field, as a string.
- `required`: A boolean value stating if the field is required.
- `readonly`: A boolean value stating if the field is read-only.
- `disabled`: A boolean value stating if the field is disabled.
- `schema`: The schema object for this field.
- `uiSchema`: The uiSchema object for this field.
- `onKeyChange`: A function that, when called, changes the current property key to the specified value
- `onDropPropertyClick`: A function that, when called, removes the key from the formData.

## ButtonTemplates

There are several buttons that are potentially rendered in the `Form`.
Each of these buttons have been customized in the themes, and can be customized by you as well.
All but one of these buttons (i.e. the `SubmitButton`) are rendered currently as icons with title text for a description.

Each button template (except for the `SubmitButton`) accepts, as props, the standard [HTML button attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) along with the following:

- `iconType`: An alternative specification for the type of the icon button.
- `icon`: The name representation or actual react element implementation for the icon.
- `uiSchema`: The uiSchema object for this field.
- `registry`: The `registry` object.

### AddButton

The `AddButton` is used to render an add action on a `Form` for both a new `additionalProperties` element for an object or a new element in an array.
You can customize the `AddButton` to render something other than the icon button that is provided by a theme as follows:

```tsx
import React from 'react';
import { IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { FormattedMessage } from 'react-intl';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

function AddButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  return (
    <button {...btnProps}>
      {icon} <FormattedMessage defaultMessage='Add' />
    </button>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ ButtonTemplates: { AddButton } }} />,
  document.getElementById('app')
);
```

### MoveDownButton

The `MoveDownButton` is used to render a move down action on a `Form` for elements in an array.
You can customize the `MoveDownButton` to render something other than the icon button that is provided by a theme as follows:

```tsx
import React from 'react';
import { IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { FormattedMessage } from 'react-intl';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

function MoveDownButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  return (
    <button {...btnProps}>
      {icon} <FormattedMessage defaultMessage='Move Down' />
    </button>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ ButtonTemplates: { MoveDownButton } }} />,
  document.getElementById('app')
);
```

### MoveUpButton

The `MoveUpButton` is used to render a move up action on a `Form` for elements in an array.
You can customize the `MoveUpButton` to render something other than the icon button that is provided by a theme as follows:

```tsx
import React from 'react';
import { IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { FormattedMessage } from 'react-intl';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

function MoveUpButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  return (
    <button {...btnProps}>
      {icon} <FormattedMessage defaultMessage='Move Up' />
    </button>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ ButtonTemplates: { MoveUpButton } }} />,
  document.getElementById('app')
);
```

### RemoveButton

The `RemoveButton` is used to render a remove action on a `Form` for both a existing `additionalProperties` element for an object or an existing element in an array.
You can customize the `RemoveButton` to render something other than the icon button that is provided by a theme as follows:

```tsx
import React from 'react';
import { IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { FormattedMessage } from 'react-intl';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

function RemoveButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  return (
    <button {...btnProps}>
      {icon} <FormattedMessage defaultMessage='Remove' />
    </button>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ ButtonTemplates: { RemoveButton } }} />,
  document.getElementById('app')
);
```

### SubmitButton

The `SubmitButton` is already very customizable via the `UISchemaSubmitButtonOptions` capabilities in the `uiSchema` but it can also be fully customized as you see fit.

> NOTE: However you choose to implement this, making it something other than a `submit` type `button` may result in the `Form` not submitting when pressed.
> You could also choose to provide your own submit button as the [children prop](../api-reference/form-props.md#children) of the `Form` should you so choose.

```tsx
import React from 'react';
import { getSubmitButtonOptions, RJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { FormattedMessage } from 'react-intl';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

function SubmitButton(props: SubmitButtonProps) {
  const { uiSchema } = props;
  const { norender } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <button type='submit'>
      <FormattedMessage defaultMessage='Okay' />
    </button>
  );
}

render(
  <Form schema={schema} validator={validator} templates={{ ButtonTemplates: { SubmitButton } }} />,
  document.getElementById('app')
);
```

The following prop is passed to a `SubmitButton`:

- `uiSchema`: The uiSchema object for this field, used to extract the `UISchemaSubmitButtonOptions`.
- `registry`: The `registry` object.
