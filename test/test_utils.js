/* Utils for tests. */

import React from "react";
import sinon from "sinon";
import { renderIntoDocument, Simulate as SimulateSync } from "react-addons-test-utils";
import { findDOMNode } from "react-dom";

import Form from "../src";


export function createComponent(Component, props) {
  const comp = renderIntoDocument(<Component {...props} />);
  const node = findDOMNode(comp);
  return new Promise((resolve) => {
    setImmediate(() => {
      resolve({comp, node});
    });
  });
}

export function createFormComponent(props) {
  return createComponent(Form, {...props, safeRenderCompletion: true});
}

export function createSandbox() {
  const sandbox = sinon.sandbox.create();
  // Ensure we catch any React warning and mark them as test failures.
  sandbox.stub(console, "error", (error) => {
    throw new Error(error);
  });
  return sandbox;
}

export function updateComponentProps(comp, props) {
  comp.componentWillReceiveProps(props);
  return new Promise(setImmediate);
}

/**
 * This decorates the React Simulate object to ensure at least tick is passed
 * after the event is triggered.
 */
export const Simulate = (() => {
  return Object.keys(SimulateSync).reduce((acc, key) => {
    if (typeof SimulateSync[key] === "function") {
      acc[key] = (...args) => {
        return new Promise((resolve) => {
          SimulateSync[key].call(SimulateSync, ...args);
          setImmediate(resolve);
        });
      };
    } else {
      acc[key] = SimulateSync[key];
    }
    return acc;
  }, {});
})();
