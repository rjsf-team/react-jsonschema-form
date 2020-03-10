/* Utils for tests. */

import React from "react";
import sinon from "sinon";
import { renderIntoDocument, act } from "react-dom/test-utils";
import { findDOMNode, render } from "react-dom";

import Form from "../src";

class Wrapper extends React.Component {
  // so functional components can be tested
  render() { 
    return this.props.children;
  }
}


export function createComponent(Component: any, props: any) {
  const onChange = sinon.spy();
  const onError = sinon.spy();
  const onSubmit = sinon.spy();
  const comp = renderIntoDocument(
    <Wrapper>
      <Component
        onSubmit={onSubmit}
        onError={onError}
        onChange={onChange}
        {...props}
      />
    </Wrapper>
  );
  const node = findDOMNode(comp as any) as HTMLFormElement;
  return { comp, node, onChange, onError, onSubmit };
}

export function createFormComponent(props: any) {
  return createComponent(Form, { ...props });
}

export function createSandbox() {
  const sandbox = sinon.createSandbox();
  return sandbox;
}

export function setProps(comp: any, newProps: any) {
  const node = findDOMNode(comp);
  render(React.createElement(comp!.constructor, newProps) as any, node!.parentNode as any);
}

/* Run a group of tests with different combinations of omitExtraData and liveOmit as form props.
 */
export function describeRepeated(title: string, fn: any) {
  const formExtraPropsList = [
    { omitExtraData: false },
    { omitExtraData: true },
    { omitExtraData: true, liveOmit: true },
  ];
  for (let formExtraProps of formExtraPropsList) {
    const createFormComponentFn = (props: any) =>
      createFormComponent({ ...props, ...formExtraProps });
    describe(title + " " + JSON.stringify(formExtraProps), () =>
      fn(createFormComponentFn)
    );
  }
}

export function submitForm(node: HTMLElement) {
  act(() => {
    node.querySelector<HTMLInputElement>("button[type=submit]")!.click();
  });
}
