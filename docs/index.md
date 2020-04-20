react-jsonschema-form
=====================

[![Build Status](https://travis-ci.org/mozilla-services/react-jsonschema-form.svg)](https://travis-ci.org/mozilla-services/react-jsonschema-form)

A simple [React](https://reactjs.org/) component capable of building HTML forms out of a [JSON schema](http://json-schema.org/).

A [live playground](https://rjsf-team.github.io/react-jsonschema-form/) is hosted on GitHub Pages:

<a target="_blank" href="https://rjsf-team.github.io/react-jsonschema-form/"><img alt="Playground" src="https://i.imgur.com/M8ZCES5.gif" /></a>

## Philosophy

react-jsonschema-form is meant to automatically generate a React form based on a [JSON Schema](http://json-schema.org/). If you want to generate a form for any data, sight unseen, simply given a JSON schema, react-jsonschema-form may be for you. If you have _a priori_ knowledge of your data and want a toolkit for generating forms for it, you might look elsewhere.

react-jsonschema-form also comes with tools such as `uiSchema` and other form props to customize the look and feel of the form beyond the default themes.

## Installation

First install the dependency from npm:

```bash
$ npm install @rjsf/core --save
```

Our latest version requires React 16+. You can also install `react-jsonschema-form` (the 1.x version) which works with React 15+.

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

This will generate a form like this:

![](https://i.imgur.com/DZQYPyu.png)


## Styling your forms

By default, library renders form fields and widgets leveraging the [Bootstrap](http://getbootstrap.com/) semantics,
meaning that you must load the Bootstrap stylesheet on the page to view the form properly.

We also support the following themes:

 Theme Name | Status | Package Name / Link
 ---------- | ------- | -----------
 Bootstrap 3 (default) | Published | `@rjsf/core`
 material-ui | Published | `@rjsf/material-ui` 
 antd | Draft | [#1561](https://github.com/rjsf-team/react-jsonschema-form/pull/1561)
 Semantic UI | Draft | [#1585](https://github.com/rjsf-team/react-jsonschema-form/pull/1585)

To use a theme from a package, just import the `<Form />` component from that package. For example, to use the material ui form,
first install both `@rjsf/core` and `@rjsf/material-ui`. Then you can import the form by doing:

```jsx
import Form from "@rjsf/material-ui";
```

If you would like to contribute a theme with a new UI framework, please develop the theme using the `withTheme` component described in [Theme Customization](theme-customization.md) and make a PR!

You can also use the uiSchema to add custom CSS class names to your form.

## Useful samples

 - Custom field template: <https://jsfiddle.net/hdp1kgn6/1/>
 - Multi-step wizard: <https://jsfiddle.net/sn4bnw9h/1/>
 - Using classNames with uiSchema: <https://jsfiddle.net/gfwp25we/1/>
 - Conditional fields: <https://jsfiddle.net/69z2wepo/88541/>
 - Advanced conditional fields: <https://jsfiddle.net/cowbellerina/zbfh96b1/>
 - Use radio list for enums: <https://jsfiddle.net/f2y3fq7L/2/>
 - Reading file input data: <https://jsfiddle.net/f9vcb6pL/1/>
 - Custom errors messages with transformErrors: <https://jsfiddle.net/revolunet/5r3swnr4/>
 - 2 columns form with CSS and FieldTemplate: <https://jsfiddle.net/n1k0/bw0ffnz4/1/>
 - Validate and submit form from external control: <https://jsfiddle.net/spacebaboon/g5a1re63/>
 - Custom component for Help text with `ui:help`: <https://codesandbox.io/s/14pqx97xl7/>
 - Collapsing / Showing and Hiding individual fields: <https://codesandbox.io/s/examplereactjsonschemaformcollapsefieldtemplate-t41dn>


## License

Apache 2


## Credits

|  <img style="height: 100px !important" src="https://avatars1.githubusercontent.com/u/1066228?s=200&v=4"> |  <img style="height: 100px !important" src="https://user-images.githubusercontent.com/1689183/51487090-4ea04f80-1d57-11e9-9a91-79b7ef8d2013.png"></a> | <img style="height: 100px !important" src="https://www.netlify.com/img/global/badges/netlify-color-accent.svg" />  |
|---|---|---|
|This project initially started as a [mozilla-services](https://github.com/mozilla-services) project. |Testing is powered by [BrowserStack](https://www.browserstack.com/).|Deploy Previews are provided by [Netlify](https://www.netlify.com).|
