import React from "react";
import { render } from "react-dom";
import { Theme as MuiTheme } from "@rjsf/material-ui";
import { Theme as AntdTheme } from "@rjsf/antd";
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
  "antd": {
    stylesheet:
      "//cdnjs.cloudflare.com/ajax/libs/antd/4.1.4/antd.min.css",
    theme: AntdTheme,
  },
};

render(<Playground themes={themes} />, document.getElementById("app"));
