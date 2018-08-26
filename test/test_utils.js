/* Utils for tests. */

import React from "react";
import sinon from "sinon";
import {
  renderIntoDocument,
  findRenderedComponentWithType,
  findRenderedDOMComponentWithTag,
} from "react-addons-test-utils";
import { findDOMNode, render } from "react-dom";

import FormWithTheme, { Form } from "../src";

export function createComponent(Component, props) {
  const comp = renderIntoDocument(<Component {...props} />);
  const node = findDOMNode(comp);
  return { comp, node };
}

export function createFormComponent(props) {
  const compWithTheme = renderIntoDocument(
    <FormWithTheme {...props} safeRenderCompletion={true} />
  );
  const nodeWithTheme = findDOMNode(compWithTheme);
  const compForm = findRenderedComponentWithType(compWithTheme, Form);
  const nodeForm = findRenderedDOMComponentWithTag(compWithTheme, "form");

  return {
    comp: compForm,
    node: nodeForm,
    withTheme: {
      comp: compWithTheme,
      node: nodeWithTheme,
    },
  };
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
