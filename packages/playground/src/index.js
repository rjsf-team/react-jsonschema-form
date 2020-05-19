import React from "react";
import Playground from "./app";
import { render } from "react-dom";
import { themes } from "./themes";

render(<Playground themes={themes} />, document.getElementById("app"));
