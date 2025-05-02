import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import React from 'react'; // Keep React import for createElement

// Assign TextEncoder and TextDecoder to global for jsdom
Object.assign(global, { TextEncoder, TextDecoder });

// Mock @trussworks/react-uswds components
jest.mock('@trussworks/react-uswds', () => {
  const React = require('react'); // Ensure React is required here

  const componentsToMock = [
    'Checkbox',
    'ComboBox',
    'Fieldset',
    'FileInput',
    'FormGroup',
    'Grid',
    'GridContainer',
    'Icon',
    'Label',
    'Radio',
    // 'RangeSlider', // Keep commented out if not exported/used
    'Select',
    'Textarea',
    'TextInput',
    'Alert',
    'Button',
    'ButtonGroup',
  ];

  const mockComponents: { [key: string]: React.FC<any> } = {};

  componentsToMock.forEach((componentName) => {
    mockComponents[componentName] = jest.fn(({ children, ...props }) =>
      React.createElement(
        `div`,
        {
          'data-testid': `mock-${componentName}`,
          'data-mock-props': JSON.stringify(props),
          ...props,
        },
        children,
      ),
    );
  });

  if (mockComponents.Icon) {
    const mockIcon: any = mockComponents.Icon;
    mockIcon.Add = jest.fn((props) => React.createElement('div', { 'data-testid': 'mock-Icon.Add', ...props }));
    mockIcon.ArrowDownward = jest.fn((props) =>
      React.createElement('div', { 'data-testid': 'mock-Icon.ArrowDownward', ...props })
    );
    mockIcon.ArrowUpward = jest.fn((props) =>
      React.createElement('div', { 'data-testid': 'mock-Icon.ArrowUpward', ...props })
    );
    mockIcon.ContentCopy = jest.fn((props) =>
      React.createElement('div', { 'data-testid': 'mock-Icon.ContentCopy', ...props })
    );
    mockIcon.Delete = jest.fn((props) => React.createElement('div', { 'data-testid': 'mock-Icon.Delete', ...props }));
  }

  return {
    ...mockComponents,
  };
});

// You might need other setup code here, e.g., for testing-library
