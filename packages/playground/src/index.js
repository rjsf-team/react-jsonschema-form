import React from "react";
import { render } from "react-dom";
import { Theme as MuiTheme } from "@rjsf/material-ui";
import Playground from "./app";

const themes = {
  default: {
    stylesheet:
      "//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    theme: {},
  },
  "material-ui": {
    stylesheet: "",
    theme: MuiTheme,
  },
};

render(<Playground themes={themes} />, document.getElementById("app"));
