# Custom Themes

The `withTheme` component provides an easy way to extend the functionality of react-jsonschema-form by passing in a theme object that defines custom/overridden widgets and fields, as well as any of the other possible properties of the standard rjsf `Form` component.
This theme-defining object is passed as the only parameter to the HOC (`withTheme(ThemeObj)`), and the HOC will return a themed-component which you use instead of the standard `Form` component.

## Usage

```tsx
import React, { Component } from 'react';
import validator from '@rjsf/validator-ajv8';
import { withTheme, ThemeProps } from '@rjsf/core';

const theme: ThemeProps = { widgets: { test: () => <div>test</div> } };

const ThemedForm = withTheme(theme);

const Demo = () => <ThemedForm schema={schema} uiSchema={uiSchema} validator={validator} />;
```

## Theme object properties

The Theme object consists of the same properties as the rjsf `Form` component (such as **widgets**, **fields** and **templates**).
The themed-Form component merges together any theme-specific **widgets**, **fields** and **templates** with the default **widgets**, **fields** and **templates**.
For instance, providing a single widget in **widgets** will merge this widget with all the default widgets of the rjsf `Form` component, but overrides the default if the theme's widget's name matches the default widget's name.
Thus, for each default widget or field not specified/overridden, the themed-form will rely on the defaults from the rjsf `Form`.
Note that you are not required to pass in either custom **widgets**, **fields** or **templates** when using the custom-themed HOC component;
you can essentially redefine the default Form by simply doing `const Form = withTheme({});`.

### Widgets and fields

**widgets** and **fields** should be in the same format as shown [here](./custom-widgets-fields.md).

Example theme with custom widget:

```tsx
import { WidgetProps, RegistryWidgetsType } from '@rjsf/utils';
import { ThemeProps } from '@rjsf/core';

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

const myWidgets: RegistryWidgetsType = {
  myCustomWidget: MyCustomWidget,
};

const ThemeObject: ThemeProps = { widgets: myWidgets };
export default ThemeObject;
```

The above can be similarly done for **fields** and **templates**.

### Templates

Each template should be passed into the theme object via the **templates** object just as you would into the rjsf Form component. Here is an example of how to use a custom [ArrayFieldTemplate](./custom-templates.md#arrayfieldtemplate) and [ErrorListTemplate](./custom-templates.md#errorlisttemplate) in the theme object:

```tsx
import { ArrayFieldTemplateProps, ErrorListProps } from '@rjsf/utils';
import { ThemeProps } from '@rjsf/core';

function MyArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  return (
    <div>
      {props.items.map((element) => element.children)}
      {props.canAdd && <button type='button' onClick={props.onAddClick}></button>}
    </div>
  );
}

function MyErrorListTemplate(props: ErrorListProps) {
  const { errors } = props;
  return (
    <ul>
      {errors.map((error) => (
        <li key={error.stack}>{error.stack}</li>
      ))}
    </ul>
  );
}

const ThemeObject: ThemeProps = {
  templates: {
    ArrayFieldTemplate: MyArrayFieldTemplate,
    ErrorListTemplate: MyErrorListTemplate,
  },
  widgets: myWidgets,
};

export default ThemeObject;
```

### Presentation

A theme's **presentation** is a `ThemePresentation` declaring which parts of a field its fields and widgets draw themselves: the `label`, `description`, `errors` and `help`, each owned by the `'template'` (the `FieldTemplate`) or by the component itself (`'self'`), and `labelledBy`, how a label the template draws reaches the control.
A widget whose control holds `false` left alone, as a checkbox or a switch does, declares `uncheckedIsFalse: true`, so a required boolean the schema lets be `false` isn't given a native `required` that would stop the browser submitting it ([#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388)); `@rjsf/core` declares it for its `CheckboxWidget`. It describes one control, so it is declared under that widget's key: `default` and `fieldDefault` don't take it, since a blanket would also mark the `select` or `radio` a boolean can render.
Declarations are keyed by the name a field or widget is registered under, so a wrapper registered under the same name keeps them.
A `default` covers every part the theme's own entry for a widget leaves out, for every widget, custom ones included, so it also overrides what `@rjsf/core` declares for those parts; a `fieldDefault` covers every part a field's merged entry leaves out.

```tsx
import { ThemeProps } from '@rjsf/core';

const ThemeObject: ThemeProps = {
  widgets: myWidgets,
  presentation: {
    // Every widget built on this library draws its own label, its checkbox its description too
    default: { label: 'self' },
    widgets: { CheckboxWidget: { label: 'self', description: 'self' } },
    // This theme's template draws no label, so an `anyOf`/`oneOf` field is named by its option selector
    fields: { AnyOfField: { label: 'self' }, OneOfField: { label: 'self' } },
  },
};
```

A declaration states what the theme's templates and widgets do.
`@rjsf/core` declares that its checkbox draws its own label and description, that a radio or checkboxes group is labelled through `aria-labelledby`, that the fields rendering one widget (`StringField`, `NumberField`, `BooleanField`, and `ArrayField` as a multi-select or files) leave every part to it, and that an `anyOf`/`oneOf` field and the fallback UI are labelled by the template; everything else is drawn by the template, except the label and description of a custom field, an object, an array that renders no single widget and a `null` field, which they draw themselves.
`SchemaField` hands the theme's `FieldTemplate` the parts the plan gives it as `displayLabel`, `description`, `help` and `errors`, and its widgets `hideLabel`, so a template renders what it is handed and a widget draws its label where `hideLabel` is false.

The theme's declarations are layered part by part over `@rjsf/core`'s, and the `Form`'s [`presentation`](../api-reference/form-props.md#presentation) prop over the theme's, by [`mergeThemePresentation()`](../api-reference/utility-functions.md#mergethemepresentation), so each layer declares only the parts it changes.

## Overriding other Form props

Just as the theme can override **widgets**, **fields**, any of the **templates**, and set default values to properties like **showErrorList**, you can do the same with the instance of the withTheme() Form component.

```tsx
import { ThemeProps } from '@rjsf/core';

const ThemeObject: ThemeProps = {
  templates: {
    ArrayFieldTemplate: MyArrayFieldTemplate,
  },
  fields: myFields,
  showErrorList: false,
  widgets: myWidgets,
};
```

Thus, the user has higher priority than the withTheme HOC, and the theme has higher priority than the default values of the rjsf Form component (**User** > **Theme** > **Defaults**).
