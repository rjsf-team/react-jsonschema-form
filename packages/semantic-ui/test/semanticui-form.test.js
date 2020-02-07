import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SemanticUIForm } from '../src';

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');

    ReactDOM.render(<SemanticUIForm schema={{}} />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
