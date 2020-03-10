import React from 'react';
import ReactDOM from 'react-dom';
import { withTheme } from '@rjsf/core';
import { Theme } from '../src';

const { describe, it } = global;

const Form = withTheme(Theme);

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');

    ReactDOM.render(<Form schema={{}} />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
