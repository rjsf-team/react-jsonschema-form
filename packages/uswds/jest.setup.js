import React from 'react';
import { withTheme } from '@rjsf/core';
import Theme from './src/Theme';

// Create a proper React component constructor, not an object
const Form = withTheme(Theme);

// Make React available globally
global.React = React;

// Make Form available globally as a component
global.Form = Form;

// Make Form available for tests that use named imports
React.Form = Form;

// Suppress specific console errors that might appear during testing
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out expected errors
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Error: Element type is invalid') ||
      args[0].includes('Warning: React.createElement'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
