/* Utils for tests. */

import React from "react";
import sinon from "sinon";
import { renderIntoDocument } from "react-addons-test-utils";
import { findDOMNode, render } from "react-dom";

import Form from "../src";

export function createComponent(Component, props) {
  const comp = renderIntoDocument(<Component {...props} />);
  const node = findDOMNode(comp);
  return { comp, node };
}

export function createFormComponent(props) {
  return createComponent(Form, { ...props, safeRenderCompletion: true });
}

export function createSandbox() {
  const sandbox = sinon.sandbox.create();
  // Ensure we catch any React warning and mark them as test failures.
  sandbox.stub(console, "error", error => {
    throw new Error(error);
  });
  return sandbox;
}

export function setProps(comp, newProps) {
  const node = findDOMNode(comp);
  render(React.createElement(comp.constructor, newProps), node.parentNode);
}
