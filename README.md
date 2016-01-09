react-jsonschema-form
=====================

[![Build Status](https://travis-ci.org/mozilla-services/react-jsonschema-form.svg)](https://travis-ci.org/mozilla-services/react-jsonschema-form)

A simple [React](http://facebook.github.io/react/) component capable of building HTML forms out of a [JSON schema](http://jsonschema.net/).

A [live demo](https://mozilla-services.github.io/react-jsonschema-form/) is hosted on gh-pages.

![](http://i.imgur.com/oxBlg96.png)

## Installation

Requires React 0.14+.

As a npm-based project dependency:

```
$ npm install react-jsonschema-form --save
```

As a script dependency served from a CDN:

```html
  <script src="https://npmcdn.com/react-jsonschema-form@0.8.0/dist/react-jsonschema-form.js"></script>
```

Source maps are available at [this url](https://npmcdn.com/react-jsonschema-form@0.8.0/dist/react-jsonschema-form.js.map).

Note that the CDN version **does not** embed *react* nor *react-dom*.

A default, very basic CSS stylesheet is provided, though you're encouraged to build your own.

```html
<link rel="stylesheet" href="https://npmcdn.com/react-jsonschema-form@0.8.0/dist/react-jsonschema-form.css">
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

### Alternative widgets

JSONSchema is limited for describing how a given data type should be rendered as an input component, that's why this lib introduces the concept of *UI schema*. A UI schema is basically an object literal describing which UI widget should be used to render a certain field

Example:

```jsx
const uiSchema =  {
  done: {
    widget: "radio" // could also be "select"
  }
};

render((
  <Form schema={schema}
        uiSchema={uiSchema}
        formData={formData} />
), document.getElementById("app"));
```

Here's a list of supported alternative widgets for different JSONSchema data types:

#### `boolean`:

  * `radio`: a radio button group with `true` and `false` as selectable values;
  * `select`: a select box with `true` and `false` as options;
  * by default, a checkbox is used

#### `string`:

  * `textarea`: a `textarea` element;
  * `password`: an `input[type=password]` element;
  * by default, a regular `input[type=text]` element is used.

#### `number` and `integer`:

  * `updown`: an `input[type=number]` updown selector;
  * `range`: an `input[type=range]` slider;
  * by default, a regular `input[type=text]` element is used.

> Note: for numbers, `min`, `max` and `step` input attributes values will be handled according to JSONSchema's `minimum`, `maximium` and `multipleOf` values when they're defined.

## Custom styles

The UISchema object accepts a `classNames` property for each field of the schema:

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

## Custom widgets

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
  widget: (props) => {
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

The following props are passed to the widget component:

- `schema`: The JSONSchema subschema object for this field;
- `value`: The current value for this field;
- `defaultValue`: The default value for this field;
- `required`: The required status of this field;
- `onChange`: The value change event handler; call it with the new value everytime it changes;
- `placeholder`: The placeholder value, if any;
- `options`: The list of options for `enum` fields;

## Custom SchemaField

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

## Development server

```
$ npm start
```

A live development server showcasing components with hot reload enabled is available at [localhost:8080](http://localhost:8080).

## Tests

```
$ npm test
```

### TDD

```
$ npm run tdd
```

## License

Apache 2
