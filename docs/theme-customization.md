## Customizing with other frameworks

### withTheme Higher-Order Component
`withTheme` component provides a way to extend the functionality of react-jsonschema-form by passing in a theme object, which contains an easy way to change the appearance of the form, widgets, templates and fields by passing in theme object. This object is passed as the only parameter like so: `withTheme(ThemeObj)` and it returns component which you use instead of standard `Form` component.

### Usage

```jsx
import React, { Component } from 'react';
import { withTheme } from 'react-jsonschema-form';
import Bootstrap4Theme from 'react-jsonschema-form-theme-bs4';

const ThemedForm = withTheme(Bootstrap4Theme); 
class Demo extends Component {
    render() {
        return <ThemedForm schema={{...}} uiSchema={{...}} />
    }
}
```

### Theme object
The Theme object consists of the properties **widgets**, **templates** and **fields**. The form merges each prop's value with the default value for it; for example, providing a single widget in **widgets** will merge it with all default widgets and overrides it if names are equal. If one of these properties is not specified, the form reverts to the default. None are required, although at least one should be provided though.

#### widgets and fields 
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

const ThemeObject = {widgets: myWidgets};
export default ThemeObject;
```

The above can be similarly done for **fields**.

#### templates
**templates** should be an object containing template objects which gets spread (using spread operator, like so `<Form {...theme.templates} />`). In [here](/advanced-customization/#array-field-template) and [here](/advanced-customization/#error-list-template) are two examples of custom templates, below is example how to use these two custom templates in theme object:
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

const myTemplates = {
    ArrayFieldTemplate: MyArrayFieldTemplate, 
    ErrorList: MyErrorListTemplate,
};

const ThemeObject = {
    templates: myTemplates
};

export default ThemeObject;
```

### Overriding
As well as theme can override **widgets**, **templates** and **fields**, you can override **widgets**, **templates**, **fields** of theme just as usual. So user has higher priority than theme and theme higher than default values (**User**>**Theme**>**Defaults**).