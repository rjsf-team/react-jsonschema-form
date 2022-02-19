import React from "react";
import { Theme4 as MuiV4Theme, Theme5 as MuiV5Theme } from "@rjsf/material-ui";
import { Theme as FluentUITheme } from "@rjsf/fluent-ui";
import { Theme as SuiTheme } from "@rjsf/semantic-ui";
import { Theme as AntdTheme } from "@rjsf/antd";
import { Theme as Bootstrap4Theme } from "@rjsf/bootstrap-4";
import { Theme as ChakraUITheme } from "@rjsf/chakra-ui";
import { Theme as PrimeReactTheme } from "@rjsf/primereact";
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
  antd: {
    stylesheet: "//cdnjs.cloudflare.com/ajax/libs/antd/4.1.4/antd.min.css",
    theme: AntdTheme,
  },
  "semantic-ui": {
    stylesheet:
      "//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css",
    theme: SuiTheme,
  },
  "fluent-ui": {
    stylesheet:
      "//static2.sharepointonline.com/files/fabric/office-ui-fabric-core/11.0.0/css/fabric.min.css",
    theme: FluentUITheme,
  },
  "bootstrap-4": {
    stylesheet:
      "https://maxcdn.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css",
    theme: Bootstrap4Theme,
  },
  "chakra-ui": {
    stylesheet: "",
    theme: ChakraUITheme,
  },
  primereact: {
    stylesheets: [
      "https://unpkg.com/primeicons@5.0.0/primeicons.css",
      "https://unpkg.com/primereact@7.2.0/resources/themes/lara-light-indigo/theme.css",
      "https://unpkg.com/primereact@7.2.0/resources/primereact.min.css",
      "https://unpkg.com/primeflex@3.1.3/primeflex.min.css",
    ],
    theme: PrimeReactTheme,
  },
};

render(<Playground themes={themes} />, document.getElementById("app"));
