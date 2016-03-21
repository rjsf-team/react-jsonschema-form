react-jsonschema-form
=====================

[![Build Status](https://travis-ci.org/mozilla-services/react-jsonschema-form.svg)](https://travis-ci.org/mozilla-services/react-jsonschema-form)

A simple [React](http://facebook.github.io/react/) component capable of building HTML forms out of a [JSON schema](http://jsonschema.net/).

A [live demo](https://mozilla-services.github.io/react-jsonschema-form/) is hosted on gh-pages.

![](http://i.imgur.com/oxBlg96.png)

## Table of Contents

  - [Installation](#installation)
  - [Usage](#usage)
  - [Form customization](#form-customization)
     - [The uiSchema object](#the-uischema-object)
     - [Alternative widgets](#alternative-widgets)
        - [For boolean fields](#for-boolean-fields)
        - [For string fields](#for-string-fields)
        - [For number and integer fields](#for-number-and-integer-fields)
     - [Object fields ordering](#object-fields-ordering)
     - [Custom CSS class names](#custom-css-class-names)
     - [Custom labels for enum fields](#custom-labels-for-enum-fields)
     - [Multiple choices list](#multiple-choices-list)
     - [Form action buttons](#form-action-buttons)
  - [Advanced customization](#advanced-customization)
     - [Custom widget components](#custom-widget-components)
     - [Custom field components](#custom-field-components)
     - [Custom SchemaField](#custom-schemafield)
     - [Custom titles](#custom-titles)
  - [Schema definitions and references](#schema-definitions-and-references)
  - [Contributing](#contributing)
     - [Development server](#development-server)
     - [Tests](#tests)
        - [TDD](#tdd)
  - [License](#license)

---

## Installation

Requires React 0.14+.

As a npm-based project dependency:

```
$ npm install react-jsonschema-form --save
```

As a script dependency served from a CDN:

```html
  <script src="https://npmcdn.com/react-jsonschema-form/dist/react-jsonschema-form.js"></script>
```

Source maps are available at [this url](https://npmcdn.com/react-jsonschema-form/dist/react-jsonschema-form.js.map).

Note that the CDN version **does not** embed *react* nor *react-dom*.

A default, very basic CSS stylesheet is provided, though you're encouraged to build your own.

```html
<link rel="stylesheet" href="https://npmcdn.com/react-jsonschema-form@0.10.0/dist/react-jsonschema-form.css">
```

## Usage

```jsx
import React, { Component } from "react";
import { render } from "react-dom";

import Form from "react-jsonschema-form";

const schema = {
  title: "Todo Tasks",
  type: "object",
  required: ["title"],
  properties: {
    title: {type: "string", title: "Title", default: "A new task"},
    done: {type: "boolean", title: "Done?", default: false}
  }
};

const formData = {
  title: "First task",
  done: true
};

const log = (type) => console.log.bind(console, type);

render((
  <Form schema={schema}
        formData={formData}
        onChange={log("changed")}
        onSubmit={log("submitted")}
        onError={log("errors")} />
), document.getElementById("app"));
```

That should give something like this (if you use the default stylesheet):

![](http://i.imgur.com/qKFvod6.png)

## Form customization

### The `uiSchema` object

JSONSchema is limited for describing how a given data type should be rendered as a form input component, that's why this lib introduces the concept of *UI schema*.

A UI schema is basically an object literal providing information on **how** the form should be rendered, while the JSON schema tells **what**.

The uiSchema object follows the tree structure of the form field hierarchy, and for each allows to define how it should be rendered:

```js
const schema = {
  type: "object",
  properties: {
    foo: {
      type: "object",
      properties: {
        bar: {type: "string"}
      }
    }
  }
}

const uiSchema = {
  foo: {
    bar: {
      "ui:widget": "textarea"
    }
  }
}

render(<Form schema={schema} uiSchema={formData} />,
       document.getElementById("app"));
```

### Alternative widgets

The uiSchema `ui:widget` property tells the form which UI widget should be used to render a certain field:

Example:

```jsx
const uiSchema =  {
  done: {
    "ui:widget": "radio" // could also be "select"
  }
};

render((
  <Form schema={schema}
        uiSchema={uiSchema}
        formData={formData} />
), document.getElementById("app"));
```

Here's a list of supported alternative widgets for different JSONSchema data types:

#### For `boolean` fields

  * `radio`: a radio button group with `true` and `false` as selectable values;
  * `select`: a select box with `true` and `false` as options;
  * by default, a checkbox is used

#### For `string` fields

  * `textarea`: a `textarea` element;
  * `password`: an `input[type=password]` element;
  * by default, a regular `input[type=text]` element is used.

#### For `number` and `integer` fields

  * `updown`: an `input[type=number]` updown selector;
  * `range`: an `input[type=range]` slider;
  * by default, a regular `input[type=text]` element is used.

> Note: for numbers, `min`, `max` and `step` input attributes values will be handled according to JSONSchema's `minimum`, `maximium` and `multipleOf` values when they're defined.

### Object fields ordering

The `uiSchema` object spec also allows you to define in which order a given object field properties should be rendered using the `ui:order` property:

```jsx
const schema = {
  type: "object",
  properties: {
    foo: {type: "string"},
    bar: {type: "string"}
  }
};

const uiSchema = {
  "ui:order": ["bar", "foo"]
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

### Custom CSS class names

The uiSchema object accepts a `classNames` property for each field of the schema:

```jsx
const uiSchema = {
  title: {
    classNames: "task-title foo-bar"
  }
};
```

Will result in:

```html
<div class="field field-string task-title foo-bar" >
  <label>
    <span>Title*</span>
    <input value="My task" required="" type="text">
  </label>
</div>
```

### Custom labels for `enum` fields

This library supports the [`enumNames`](https://github.com/json-schema/json-schema/wiki/enumNames-%28v5-proposal%29) property for `enum` fields, which allows defining custom labels for each option of an `enum`:

```js
const schema = {
  type: "number",
  enum: [1, 2, 3],
  enumNames: ["one", "two", "three"]
};
```

This will be rendered using a select box that way:

```html
<select>
  <option value="1">one</option>
  <option value="2">two</option>
  <option value="3">three</option>
</select>
```

Note that string representations of numbers will be cast back and reflected as actual numbers into form state.

### Multiple choices list

The default behavior for array fields is a list of text inputs with add/remove buttons. If you want a multiple choices list, you have to provide an `enum` list to the `items` property of the array field and set `uniqueItems` property to `true`.

See the "Arrays" section of the demo app and [this issue](https://github.com/mozilla-services/react-jsonschema-form/issues/41) for more information.

### Form action buttons

You can provide custom buttons to your form via the `Form` component's `children`. A default submit button will be rendered if you don't provide children to the `Form` component.

```jsx
render(
  <Form schema={schema}>
    <div>
      <button type="submit">Submit</button>
      <button>Cancel</button>
    </div>
  </Form>);
```

**Warning:** there should be a button or an input with `type="submit"` to trigger the form submission (and then the form validation).

## Advanced customization

The API allows to specify your own custom *widgets* and *fields* components:

- A *widget* represents a HTML tag for the user to enter data, eg. `input`, `select`, etc.
- A *field* usually wraps one or more widgets and most often handles internal field state; think of a field as a form row, including the labels.

### Custom widget components

You can provide your own custom widgets to a uiSchema for the following json data types:

- `string`
- `number`
- `integer`
- `boolean`
- `date-time`

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
        defaultValue={props.defaultValue}
        required={props.required}
        onChange={(event) => props.onChange(event.target.value)} />
    );
  }
};

render(<Form schema={schema} uiSchema={uiSchema} />);
```

Alternatively, you can register them all at once by passing the `widgets` prop to the `Form` component, and reference their identifier from the `uiSchema`:

```jsx
const MyCustomWidget = (props) => {
  return (
    <input type="text"
      className="custom"
      value={props.value}
      defaultValue={props.defaultValue}
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

render(<Form
  schema={schema}
  uiSchema={uiSchema}
  widgets={widgets}/>);
```

This is useful if you expose the `uiSchema` as pure JSON, which can't carry functions.

The following props are passed to the widget component:

- `schema`: The JSONSchema subschema object for this field;
- `value`: The current value for this field;
- `defaultValue`: The default value for this field;
- `required`: The required status of this field;
- `onChange`: The value change event handler; call it with the new value everytime it changes;
- `placeholder`: The placeholder value, if any;
- `options`: The list of options for `enum` fields;

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
render(<Form
  schema={schema}
  uiSchema={uiSchema}
  fields={fields}/>);
```

Note: Registered fields can be reused accross the entire schema.

### Custom SchemaField

**Warning:** This is a powerful feature as you can override the whole form behavior and easily mess it up. Handle with care.

You can provide your own implementation of the `SchemaField` base React component for rendering any JSONSchema field type, including objects and arrays. This is useful when you want to augment a given field type with supplementary powers.

To proceed so, you can pass a `SchemaField` prop to the `Form` component instance; here's a rather silly example wrapping the standard `SchemaField` lib component:

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

render((
  <Form schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        SchemaField={CustomSchemaField} />
), document.getElementById("app"));
```

If you're curious how this could ever be useful, have a look at the [Kinto formbuilder](https://github.com/Kinto/formbuilder) repository to see how it's used to provide editing capabilities to any form field.

### Custom titles

You can provide your own implementation of the `TitleField` base React component for rendering any title. This is useful when you want to augment how titles are handled.


To proceed so, you can pass a `TitleField` prop to the `Form` component instance:

```jsx

const CustomTitleField = ({title}) => <div id="custom">{title}</div>;

render((
  <Form schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        TitleField={CustomTitleField} />
), document.getElementById("app"));
```

## Schema definitions and references

This library partially supports [inline schema definition dereferencing]( http://json-schema.org/latest/json-schema-core.html#rfc.section.7.2.3), which is Barbarian for *avoiding to copy and paste commonly used field schemas*:

```json
{
  "definitions": {
    "address": {
      "type": "object",
      "properties": {
        "street_address": { "type": "string" },
        "city":           { "type": "string" },
        "state":          { "type": "string" }
      },
      "required": ["street_address", "city", "state"]
    }
  },
  "type": "object",
  "properties": {
    "billing_address": { "$ref": "#/definitions/address" },
    "shipping_address": { "$ref": "#/definitions/address" }
  }
}
```

*(Sample schema courtesy of the [Space Telescope Science Institute](http://spacetelescope.github.io/understanding-json-schema/structuring.html))*

Note that it only supports local definition referencing, we do not plan on fetching foreign schemas over HTTP anytime soon. Basically, you can only reference a definition from the very schema object defining it.

## Contributing

### Development server

```
$ npm start
```

A live development server showcasing components with hot reload enabled is available at [localhost:8080](http://localhost:8080).

### Tests

```
$ npm test
```

#### TDD

```
$ npm run tdd
```

## License

Apache 2
