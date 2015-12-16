react-jsonschema-form
=====================

A simple [React]() component capable of building forms from a [JSON schema]().

Requires React 0.14+.

## Installation

```
$ npm install react-jsonschema-form --save
```

## Usage

```js
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

const log = (type) => console.log.bind(console, type);

const App = ({schema}) => {
  return <Form schema={schema}
               onChange={log("changed")}
               onSubmit={log("submitted")}
               onError={log("errors")} />;
};

render(<App schema={schema} />, document.getElementById("app"));
```

## License

Apache 2
