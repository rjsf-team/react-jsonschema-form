import React from "react";
import { Theme as MuiTheme } from "rjsf-material-ui";
import Playground from "../src/index";
import { render } from "react-dom";

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
