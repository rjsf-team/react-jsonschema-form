## Philosophy

react-jsonschema-form is meant to automatically generate a React form based on a [JSON Schema](http://json-schema.org/). If you want to generate a form for any data, sight unseen, simply given a JSON schema, react-jsonschema-form may be for you. If you have _a priori_ knowledge of your data and want a toolkit for generating forms for it, you might look elsewhere.

## Installation

Requires React 16+.

> Note: The `master` branch of the repository reflects ongoing development. Releases are published as [tags](https://github.com/mozilla-services/react-jsonschema-form/releases). You should never blindly install from `master`, but rather check what the available stable releases are.


### As a npm-based project dependency

```bash
$ npm install @rjsf/core --save
```

> Note: While the library renders [Bootstrap](http://getbootstrap.com/) HTML semantics, you have to build and load the Bootstrap styles on your own.

If you would like to install an officially-supported theme such as `material-ui`:

```bash
$ npm install @rjsf/core @rjsf/material-ui --save
```

If you would like to install the old 1.x version:

```bash
$ npm install react-jsonschema-form --save
```

### As a script served from a CDN

```html
  <script src="https://unpkg.com/@rjsf/core/dist/react-jsonschema-form.js"></script>
```

Source maps are available at [this url](https://unpkg.com/@rjsf/core/dist/react-jsonschema-form.js.map).

> Note: The CDN version **does not** embed `react` or `react-dom`.

You'll also need to alias the default export property to use the Form component:

```jsx
const Form = JSONSchemaForm.default;
// or
const {default: Form} = JSONSchemaForm;
```

## Usage

```jsx
import React, { Component } from "react";
import { render } from "react-dom";

import Form from "@rjsf/core";

const schema = {
  title: "Todo",
  type: "object",
  required: ["title"],
  properties: {
    title: {type: "string", title: "Title", default: "A new task"},
    done: {type: "boolean", title: "Done?", default: false}
  }
};

const log = (type) => console.log.bind(console, type);

render((
  <Form schema={schema}
        onChange={log("changed")}
        onSubmit={log("submitted")}
        onError={log("errors")} />
), document.getElementById("app"));
```

This will generate a form like this (assuming you loaded the standard [Bootstrap](http://getbootstrap.com/) stylesheet):

![](https://i.imgur.com/DZQYPyu.png)

To generate a material-ui form, replace the import statement with

```jsx
import Form from "@rjsf/material-ui";
```

### Form initialization

Often you'll want to prefill a form with existing data; this is done by passing a `formData` prop object matching the schema:

```jsx
const formData = {
  title: "First task",
  done: true
};

render((
  <Form schema={schema}
        formData={formData} />
), document.getElementById("app"));
```

> Note: If your form has a single field, pass a single value to `formData`. ex: `formData='Charlie'`

> WARNING: If you have situations where your parent component can re-render, make sure you listen to the `onChange` event and update the data you pass to the `formData` attribute.

### Form event handlers

You can use event handlers such as `onChange`, `onError`, `onSubmit`, `onFocus`, and `onBlur` on the `<Form />` component; see the [Form Props Reference](api-reference-props.md) for more details.
