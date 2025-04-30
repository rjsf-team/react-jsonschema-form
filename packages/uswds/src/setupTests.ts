// Mock the entire @trussworks/react-uswds library
jest.mock('@trussworks/react-uswds', () => {
  // Require React INSIDE the factory function
  const React = require('react');

  // List all components used by your theme that need mocking
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
    'RangeSlider',
    'Select',
    'Textarea',
    'TextInput',
    'Alert',
    'Button',
    'ButtonGroup',
  ];

  const mockComponents: { [key: string]: React.FC<any> } = {};

  componentsToMock.forEach((componentName) => {
    // Create a simple functional component mock that renders its children
    // and passes down props. Use data-testid for easier testing.
    mockComponents[componentName] = jest.fn(({ children, ...props }) =>
      React.createElement(
        `div`, // Render as a simple div
        {
          'data-testid': `mock-${componentName}`, // Add a test ID
          'data-mock-props': JSON.stringify(props), // Stringify props for inspection
          ...props, // Pass down other props like id, name, etc.
        },
        children,
      ),
    );
  });

  // Special handling for Icon if needed
  if (mockComponents.Icon) {
    mockComponents.Icon.Add = jest.fn((props) => React.createElement('div', { 'data-testid': 'mock-Icon.Add', ...props }));
    mockComponents.Icon.ArrowDownward = jest.fn((props) => React.createElement('div', { 'data-testid': 'mock-Icon.ArrowDownward', ...props }));
    mockComponents.Icon.ArrowUpward = jest.fn((props) => React.createElement('div', { 'data-testid': 'mock-Icon.ArrowUpward', ...props }));
    mockComponents.Icon.ContentCopy = jest.fn((props) => React.createElement('div', { 'data-testid': 'mock-Icon.ContentCopy', ...props }));
    mockComponents.Icon.Delete = jest.fn((props) => React.createElement('div', { 'data-testid': 'mock-Icon.Delete', ...props }));
    // Add other icons used...
  }

  return {
    ...mockComponents, // Spread the mocked components
    // ... other non-component exports if needed ...
  };
});

// You might need other setup code here, e.g., for testing-library
