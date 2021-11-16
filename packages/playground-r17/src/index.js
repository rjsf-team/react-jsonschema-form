import React from "react";
import { Theme4 as MuiV4Theme, Theme5 as MuiV5Theme } from "@rjsf/material-ui";
import Playground from "./app";
import { render } from "react-dom";

const themes = {
  default: {
    stylesheet:
      "//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    theme: {},
    subthemes: {
      cerulean: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cerulean/bootstrap.min.css",
      },
      cosmo: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cosmo/bootstrap.min.css",
      },
      cyborg: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cyborg/bootstrap.min.css",
      },
      darkly: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/darkly/bootstrap.min.css",
      },
      flatly: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/flatly/bootstrap.min.css",
      },
      journal: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/journal/bootstrap.min.css",
      },
      lumen: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/lumen/bootstrap.min.css",
      },
      paper: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/paper/bootstrap.min.css",
      },
      readable: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/readable/bootstrap.min.css",
      },
      sandstone: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/sandstone/bootstrap.min.css",
      },
      simplex: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/simplex/bootstrap.min.css",
      },
      slate: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/slate/bootstrap.min.css",
      },
      spacelab: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/spacelab/bootstrap.min.css",
      },
      "solarized-dark": {
        stylesheet:
          "//cdn.rawgit.com/aalpern/bootstrap-solarized/master/bootstrap-solarized-dark.css",
      },
      "solarized-light": {
        stylesheet:
          "//cdn.rawgit.com/aalpern/bootstrap-solarized/master/bootstrap-solarized-light.css",
      },
      superhero: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/superhero/bootstrap.min.css",
      },
      united: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/united/bootstrap.min.css",
      },
      yeti: {
        stylesheet:
          "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/yeti/bootstrap.min.css",
      },
    },
  },
  "material-ui-4": {
    stylesheet: "",
    theme: MuiV4Theme,
  },
  "material-ui-5": {
    stylesheet: "",
    theme: MuiV5Theme,
  },
};

render(<Playground themes={themes} />, document.getElementById("app"));
