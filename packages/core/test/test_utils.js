/* Utils for tests. */

import { createElement } from 'react';
import sinon from 'sinon';
import { renderIntoDocument, act, Simulate } from 'react-dom/test-utils';
import { findDOMNode, render } from 'react-dom';
import validator from '@rjsf/validator-ajv8';

import Form from '../src';

export function createComponent(Component, props) {
  const onChange = sinon.spy();
  const onError = sinon.spy();
  const onSubmit = sinon.spy();
  const comp = renderIntoDocument(<Component onSubmit={onSubmit} onError={onError} onChange={onChange} {...props} />);
  const node = findDOMNode(comp);
  return { comp, node, onChange, onError, onSubmit };
}

export function createFormComponent(props) {
  return createComponent(Form, { validator, ...props });
}

export function createSandbox() {
  const sandbox = sinon.createSandbox();
  return sandbox;
}

export function setProps(comp, newProps) {
  const node = findDOMNode(comp);
  render(createElement(comp.constructor, newProps), node.parentNode);
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
    const createFormComponentFn = (props) => createFormComponent({ ...props, ...formExtraProps });
    describe(title + ' ' + JSON.stringify(formExtraProps), () => fn(createFormComponentFn));
  }
}

export function submitForm(node) {
  act(() => {
    Simulate.submit(node);
  });
}

export function getSelectedOptionValue(selectNode) {
  if (selectNode.type !== 'select-one') {
    throw new Error(`invalid node provided, expected select got ${selectNode.type}`);
  }
  const value = selectNode.value;
  const options = [...selectNode.options];
  const selectedOptions = options
    .filter((option) => (Array.isArray(value) ? value.includes(option.value) : value === option.value))
    .map((option) => option.text);
  if (!Array.isArray(value)) {
    return selectedOptions[0];
  }
  return selectedOptions;
}
