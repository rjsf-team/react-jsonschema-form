/* Utils for tests. */

import React from 'react';
import { render } from 'react-testing-library';
import 'jest-dom/extend-expect';

import Form from 'react-jsonschema-form/src';
import FormContainer from 'react-jsonschema-form/src/components/FormContainer';
import theme from 'react-jsonschema-form-bootstrap/src';

export function createComponent(Component, props, spy) {
  const idPrefix = props.idPrefix || 'root';
  if (!spy) {
    spy = jest.spyOn(Component.prototype, 'render');
  }
  const utils = render(<Component {...props} />);
  const node = utils.container.firstChild;
  return { ...utils, queryByModel, getInstance, rerender, node };

  /**
   * It converts model to data-testid and uses queryByTestId
   ```
   queryByModel('foo.bar') => queryByTestId('root_foo_bar')
   ```
   * @param {string} model - JSON Schema model (path with dot)
   */
  function queryByModel(model) {
    const id = `${idPrefix}_${model.replace(/\./g, '_')}`;
    return utils.queryByTestId(id);
  }

  function getInstance() {
    return spy.mock.instances[spy.mock.instances.length - 1];
  }

  function rerender(newProps) {
    utils.rerender(<Component {...props} {...newProps} />);
  }
}

export function createFormComponent(props) {
  const spy = jest.spyOn(FormContainer.prototype, 'render');
  return createComponent(
    Form,
    { theme, ...props, safeRenderCompletion: true },
    spy
  );
}

export function suppressLogs(type = 'error', fn) {
  jest.spyOn(console, type);
  global.console[type].mockImplementation(() => {});

  fn();

  global.console[type].mockRestore();
}
