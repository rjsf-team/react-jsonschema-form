# @rjsf/daisyui

A [DaisyUI](https://daisyui.com/) theme for [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/).

**Warning:** This integrates DaisyUI v5.0.0-beta.7. This is not yet released and is subject to change. It also integrates tailwindcss v4.0.6.

## Features

- Complete DaisyUI styling for all form elements
- Support for custom themes via DaisyUI theme system
- Responsive form layouts
- Support for all RJSF field types including:
  - Text inputs
  - Select dropdowns (with examples support)
  - Checkboxes and radio buttons
  - Arrays and objects
  - Enumerated objects
  - Custom array handling

## Installation

```bash
npm install @rjsf/daisyui @rjsf/core @rjsf/utils
```

## Usage

```jsx
import { Form } from '@rjsf/daisyui';
import validator from '@rjsf/validator-ajv8';

function App() {
  return (
    <Form 
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      onChange={console.log}
      onSubmit={console.log}
    />
  );
}
```

## Theme Customization

The form components use DaisyUI's theme system. You can customize the theme by adding DaisyUI theme classes to your HTML:

```html
<html data-theme="light">
  <!-- or any other DaisyUI theme -->
</html>
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test
```

## License

Apache-2.0
