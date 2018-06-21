/* Utils for tests. */

import React from 'react';
import { render } from 'react-testing-library';
import 'dom-testing-library/extend-expect';

import Form from 'react-jsonschema-form/src';

export function createComponent(Component, props) {
  const spy = jest.spyOn(Component.prototype, 'setState');
  const utils = render(<Component {...props} />);
  const comp = spy.mock.instances[0];
  return { ...utils, comp };
}

export function createFormComponent(props) {
  return createComponent(Form, { ...props, safeRenderCompletion: true });
}

export function suppressLogs(type = 'error', fn) {
  jest.spyOn(console, type);
  global.console[type].mockImplementation(() => {});

  fn();

  global.console[type].mockRestore();
}
