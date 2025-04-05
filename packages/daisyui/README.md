# @rjsf/daisyui

A [DaisyUI](https://daisyui.com/) theme for [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/).

This package integrates DaisyUI v6, Tailwind CSS v4, and RJSF v6 to provide a modern, customizable form experience.

## Features

- Complete DaisyUI v6 styling for all RJSF form elements
- Responsive design with mobile-friendly layouts
- Connected card styling for nested elements and arrays
- Consistent visual hierarchy for complex forms
- Support for all RJSF field types including:
  - Text inputs with proper styling and validation states
  - Select dropdowns with customizable option rendering
  - Checkboxes and radio buttons with optimized layouts
  - Arrays with add/remove/reorder functionality
  - Objects with proper nesting and visual hierarchy
  - Date/time inputs with cross-browser compatibility
- Support for custom themes via DaisyUI's theme system
- Accessible form components following WAI-ARIA practices

## Installation

```bash
npm install @rjsf/daisyui @rjsf/core @rjsf/utils tailwindcss@^4.0.0 daisyui@^6.0.0
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

For dynamic theme switching, you can change the data-theme attribute in your application code.

## Tailwind Configuration

Make sure your `tailwind.config.js` includes the DaisyUI plugin:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: true,
  },
}
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run the development server
npm run dev
```

## License

Apache-2.0
