## Customizing with other frameworks

### withTheme Higher-Order Component
`withTheme` component provides easy way to change appearence of form, widgets, templates and fields by using theme object. This object is passed as the only parameter like so: `withTheme(ThemeObj)` and it returns component which you use instead of standard `Form` component.

### Usage

```jsx
import React, { Component } from 'react'
import { withTheme } from 'react-jsonschema-form'
import Bootstrap4Theme from 'react-jsonschema-form-theme-bs4'

class Demo extends Component {
    render() {
        const ThemedForm = withTheme(Bootstrap4Theme); 
        return <ThemedForm schema={schemaObj} uiSchema={uiSchemaObj}/>
    }
}
```
*(you have to provide schemaObj and uiSchemaObj, these are excluded from example usage in favor of simplicity)*

### Theme object
Theme object consists of **widgets**, **templates**, **fields** and **form**, none of them is required, atleast one should be provided though.

#### widgets and fields 
**widgets** and **fields** should be in exact format as show in [here](/advanced-customization/#custom-widgets-and-fields).

example theme with custom widget:
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
similarly for **fields**

#### templates
**templates** should be object containing template objects which gets spread (using spread operator, like so `<Form {...theme.templates} />`). In [here](/advanced-customization/#array-field-template) and [here](/advanced-customization/#error-list-template) are two examples of custom templates, below is example how to use these two custom templates in theme object:
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

#### form
Theme can also provide custom form component.

**Requirments**

 - Custom form have to be valid React component (extends `React.Component` class and implements `render()` method)
 - Overrided callback functions *(onSubmit, onError, onChange)*, have to call according callback with appropriate data from `this.props`
 - Somewhere in render tree of this component have to be `Form` component

**Example**

This can be usefull whenever you need another layer of data handling on top of `Form` component but outside of your app logic. One example could be Bootstrap 4 theme with input like so:
```jsx
function MyBaseInput(props) {
    ...
    return (
        <Input
            readOnly={readonly}
            disabled={disabled}
            autoFocus={autofocus}
            invalid={rawErrors!==undefined}
            valid={rawErrors===undefined && formContext.wasValidated}
            value={value == null ? "" : value}
            {...inputProps}
            onChange={_onChange}
            onBlur={onBlur && (event => onBlur(inputProps.id, event.target.value))}
            onFocus={onFocus && (event => onFocus(inputProps.id, event.target.value))}
        />
    )
}
```
Let's say this is override of BaseInput, so any *text*, *textarea*, *number*, ..., inputs looks like this, and we want to have **valid** tag only after form was submitted (otherwise it could show red and green borders around inputs, right after user sees it, which is bad practice), so we have `wasValidated` variable in form context, which gets updated. Below is example of customized `<Form>`:
```jsx
import Form from "react-jsonschema-form";
class Bootstrap4Form extends Component {
    constructor(props) {
        super(props);
        this.state = {wasValidated: false};
        this.onSubmit = this.onSubmit.bind(this);
        this.onError = this.onError.bind(this);
    }

    onSubmit({...data}) {
        this.setState({wasValidated: true});
        if(this.props.onSubmit) {
            this.props.onSubmit({...data});
        }
    }

    onError({...data}) {
        this.setState({wasValidated: true});
        if(this.props.onError) {
            this.props.onError({...data});
        }
    }

    render() {
        const {onSubmit, onError, ...otherProps} = this.props;
        return (
            <Form {...otherProps} formContext={{wasValidated: this.state.wasValidated}} onSubmit={this.onSubmit} onError={this.onError}/>
        )
    }
}
```
and theme would look like this:
```jsx
const Bootstrap4Theme = {
    form: Bootstrap4Form, 
    widgets: {BaseInput: MyBaseInput},
} 
export default Bootstrap4Theme
```

### Overriding
As well as theme can override **widgets**, **templates**, **fields** and **form**, you can override **widgets**, **templates**, **fields** just as usual. So user has higher priority than theme and theme higher than default values (**User**>**Theme**>**Defaults**).