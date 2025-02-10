# @rjsf/daisy-ui

This package provides Daisy UI components for use with `react-jsonschema-form`. It includes a set of custom widgets and templates styled with Daisy UI.

## Installation

Since this package is not published to npm, you can use it locally by linking it in your project.

## Usage

Import the `DaisyForm` component and use it in your application:

```jsx
import { DaisyForm } from '@rjsf/daisy-ui';

function App() {
  return (
    <DaisyForm schema={yourSchema} uiSchema={yourUiSchema} formData={yourFormData} />
  );
}
```

## Development

To develop and test this package locally, use the following commands:

```bash
# Build the package
npm run build

# Link the package locally
npm link

# In your application directory
npm link @rjsf/daisy-ui
```

## License

This project is licensed under the Apache-2.0 License.
