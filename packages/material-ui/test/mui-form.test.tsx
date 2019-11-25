import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MuiForm } from '../src';

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');

    ReactDOM.render(<MuiForm schema={{}} />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
