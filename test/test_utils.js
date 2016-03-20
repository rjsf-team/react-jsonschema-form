/* Utils for tests. */

import React from "react";
import { renderIntoDocument } from "react-addons-test-utils";
import { findDOMNode } from "react-dom";

import Form from "../src";

export function createComponent(Component, props) {
  const comp = renderIntoDocument(<Component {...props} />);
  const node = findDOMNode(comp);
  return {comp, node};
}

export function createFormComponent(props) {
  return createComponent(Form, props);
}

export function d(node) {
  console.log(require("html").prettyPrint(node.outerHTML, {indent_size: 2}));
}
