/* Utils for tests. */

import { createElement } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import sinon from 'sinon';
import { findDOMNode } from 'react-dom';
import validator from '@rjsf/validator-ajv8';

import Form from '../src';

export function createComponent(Component, props) {
  const onChange = sinon.spy();
  const onError = sinon.spy();
  const onSubmit = sinon.spy();
  const comp = <Component onSubmit={onSubmit} onError={onError} onChange={onChange} {...props} />;
  const { container, rerender } = render(comp);

  const rerenderFunction = (props) =>
    rerender(<Component onSubmit={onSubmit} onError={onError} onChange={onChange} {...props} />);
  const node = findDOMNode(container).firstElementChild;

  return { comp, node, onChange, onError, onSubmit, rerender: rerenderFunction };
}

export function createFormComponent(props) {
  return createComponent(Form, { validator, ...props });
}

export function createSandbox() {
  const sandbox = sinon.createSandbox();
  return sandbox;
}

export function setProps(comp, newProps) {
  render(createElement(Form, newProps), {
    container: comp.ref.current.formElement.current.parentNode,
  });
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
    fireEvent.submit(node);
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
