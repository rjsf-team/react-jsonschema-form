# Custom Themes

The `withTheme` component provides an easy way to extend the functionality of react-jsonschema-form by passing in a theme object that defines custom/overridden widgets and fields, as well as any of the other possible properties of the standard rjsf `Form` component.
This theme-defining object is passed as the only parameter to the HOC (`withTheme(ThemeObj)`), and the HOC will return a themed-component which you use instead of the standard `Form` component.

## Usage

```jsx
import React, { Component } from 'react';
import validator from '@rjsf/validator-ajv6';
import { withTheme } from '@rjsf/core';

const theme = { widgets: {test: () => (<div>test</div>) } };

const ThemedForm = withTheme(theme); 

const Demo = () => (
  <ThemedForm schema={schema} uiSchema={uiSchema} validator={validator} />
);
```

## Theme object properties
The Theme object consists of the same properties as the rjsf `Form` component (such as **widgets**, **fields** and **templates**).
The themed-Form component merges together any theme-specific **widgets**, **fields** and **templates** with the default **widgets**, **fields** and **templates**.
For instance, providing a single widget in **widgets** will merge this widget with all the default widgets of the rjsf `Form` component, but overrides the default if the theme's widget's name matches the default widget's name.
Thus, for each default widget or field not specified/overridden, the themed-form will rely on the defaults from the rjsf `Form`.
Note that you are not required to pass in either custom **widgets**, **fields** or **templates** when using the custom-themed HOC component;
you can essentially redefine the default Form by simply doing `const Form = withTheme({});`.

### Widgets and fields 
**widgets** and **fields** should be in the same format as shown [here](/advanced-customization/#custom-widgets-and-fields).

Example theme with custom widget:
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

const myWidgets = {
  myCustomWidget: MyCustomWidget
};

const ThemeObject = { widgets: myWidgets };
export default ThemeObject;
```

The above can be similarly done for **fields** and **templates**.

### Templates
Each template should be passed into the theme object via the **templates** object just as you would into the rjsf Form component. Here is an example of how to use a custom [ArrayFieldTemplate](/advanced-customization/#array-field-template) and [ErrorListTemplate](/advanced-customization/#error-list-template) in the theme object:
```jsx
function MyArrayFieldTemplate(props) {
  return (
    <div>
      {props.items.map(element => element.children)}
      {props.canAdd && <button type="button" onClick={props.onAddClick}></button>}
    </div>
  );
}

function MyErrorListTemplate(props) {
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

const ThemeObject = {
    templates: {
      ArrayFieldTemplate: MyArrayFieldTemplate,
      ErrorListTemplate: MyErrorListTemplate,
    },
    widgets: myWidgets
};

export default ThemeObject;
```

## Overriding other Form props
Just as the theme can override **widgets**, **fields**, any of the **templates**, and set default values to properties like **showErrorList**, you can do the same with the instance of the withTheme() Form component.
```jsx
const ThemeObject = {
    templates: {
      ArrayFieldTemplate: MyArrayFieldTemplate,
    },
    fields: myFields,
    showErrorList: false,
    widgets: myWidgets
};
```

Thus, the user has higher priority than the withTheme HOC, and the theme has higher priority than the default values of the rjsf Form component (**User** > **Theme** > **Defaults**).
