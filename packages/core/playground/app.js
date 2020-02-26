import React from "react";
import { render } from "react-dom";
import Playground from "@rjsf/playground";

const themes = {
  default: {
    stylesheet:
      "//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    theme: {},
  },
};

render(<Playground themes={themes} />, document.getElementById("app"));
