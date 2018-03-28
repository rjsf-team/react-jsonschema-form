/* This file has been modified from the original forked source code */
/* Utils for tests. */

import React from "react";
import sinon from "sinon";
import {renderIntoDocument, findRenderedComponentWithType} from "react-addons-test-utils";
import {findDOMNode, render} from "react-dom";

import Form from "../src";

// Since we're not setting the state in onChange, we need to
// handle it in an external component
class FormDataStateWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {formData: props.formProps.formData};
  }
  onChange(state) {
    this.setState({formData: state.formData}, () => {
      if (this.props.formProps.onChange) {
        this.props.formProps.onChange(state);
      }
    });
  }
  render() {
    return (
      <Form
        onChange={state => this.onChange(state)}
        {...this.props.formProps}
        safeRenderCompletion
        formData={this.state.formData}/>
    );
  }
}

export function createComponent(Component, props) {
  const comp = renderIntoDocument(<Component {...props}/>);
  const node = findDOMNode(comp);
  return {comp, node};
}

export function createFormComponent(props) {
  const {comp} = createComponent(FormDataStateWrapper, {formProps: props});
  const formComp = findRenderedComponentWithType(comp, Form);
  const formNode = findDOMNode(formComp);
  return {comp: formComp, node: formNode};
}

export function createSandbox() {
  const sandbox = sinon.sandbox.create();
  // Ensure we catch any React warning and mark them as test failures.
  sandbox.stub(console, "error", (error) => {
    throw new Error(error);
  });
  return sandbox;
}

export function setProps(comp, newProps) {
  const node = findDOMNode(comp);
  render(
    React.createElement(
      comp.constructor,
      newProps
    ),
    node.parentNode);
}
