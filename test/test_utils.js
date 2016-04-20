/* Utils for tests. */

import React from "react";
import sinon from "sinon";
import { renderIntoDocument } from "react-addons-test-utils";
import { findDOMNode } from "react-dom";
import { Simulate } from "react-addons-test-utils";

import Form from "../src";

export function createComponent(Component, props) {
  const comp = renderIntoDocument(<Component {...props} />);
  const node = findDOMNode(comp);
  return {comp, node};
}

export function createFormComponent(props) {
  return createComponent(Form, props);
}

export function createSandbox() {
  const sandbox = sinon.sandbox.create();
  // Ensure we catch any React warning and mark them as test failures.
  sandbox.stub(console, "error", (error) => {
    throw new Error(error);
  });
  return sandbox;
}

export function SimulateAsync(delay = 15) {
  return Object.keys(Simulate).reduce((acc, key) => {
    const prop = Simulate[key];
    if (typeof prop === "function") {
      acc[key] = (...args) => {
        return new Promise((resolve) => {
          Simulate[key](...args);
          setTimeout(resolve, delay);
        });
      };
    } else {
      acc[key] = prop;
    }
    return acc;
  }, {});
}
