/* Utils for tests. */

import React from "react";
import sinon from "sinon";
import { renderIntoDocument } from "react-dom/test-utils";
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
  return sandbox;
}

export function setProps(comp, newProps) {
  const node = findDOMNode(comp);
  render(React.createElement(comp.constructor, newProps), node.parentNode);
}

/* Run a group of tests with different combinations of omitExtraData and liveOmit as form props.
 */
export function describeRepeated(title, fn) {
  const formExtraPropsList = [
    { omitExtraData: false },
    { omitExtraData: true },
    { omitExtraData: true, liveOmit: true },
  ];
  for (let formExtraProps of formExtraPropsList) {
    const createFormComponentFn = props =>
      createFormComponent({ ...props, ...formExtraProps });
    describe(title + " " + JSON.stringify(formExtraProps), () =>
      fn(createFormComponentFn)
    );
  }
}
