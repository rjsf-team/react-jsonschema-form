import React from 'react';
import ReactDOM from 'react-dom';
import Form from '../src';

const { describe, it } = global;

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');

    ReactDOM.render(<Form schema={{}} />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
