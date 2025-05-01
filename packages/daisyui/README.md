# @rjsf/daisyui

[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![License][license-shield]][license-url]

A [DaisyUI](https://daisyui.com/) theme for [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/).

This package integrates [DaisyUI](https://daisyui.com/), [Tailwind CSS](https://tailwindcss.com/), and [RJSF](https://github.com/rjsf-team/react-jsonschema-form/) to provide a modern, customizable form experience.

## Screenshots

![DaisyUI Form Example 1](daisy-screenshot1.png)
![DaisyUI Form Example 2](daisy-screenshot2.png)

## Features

- Complete DaisyUI styling for all RJSF form elements
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
npm install @rjsf/daisyui @rjsf/core @rjsf/utils tailwindcss daisyui
```

## Usage

```jsx
import { Form } from '@rjsf/daisyui';
import validator from '@rjsf/validator-ajv8';

function App() {
  return (
    <Form schema={schema} uiSchema={uiSchema} validator={validator} onChange={console.log} onSubmit={console.log} />
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
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: true,
  },
};
```

## Customization

### Grid Layout

The DaisyUI theme supports the standard RJSF layout grid system. You can use grid layouts by incorporating the `LayoutGridField` in your UI schema:

```jsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import Form from '@rjsf/daisyui';
import validator from '@rjsf/validator-ajv8';

const schema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', title: 'First Name' },
    lastName: { type: 'string', title: 'Last Name' },
    email: { type: 'string', format: 'email', title: 'Email' },
    phone: { type: 'string', title: 'Phone' },
  },
};

// Use grid layout for the form
const uiSchema = {
  'ui:field': 'LayoutGridField',
  'ui:layoutGrid': {
    'ui:row': {
      children: [
        {
          'ui:row': {
            children: [
              {
                'ui:col': {
                  xs: 12,
                  sm: 6,
                  children: ['firstName'],
                },
              },
              {
                'ui:col': {
                  xs: 12,
                  sm: 6,
                  children: ['lastName'],
                },
              },
            ],
          },
        },
        {
          'ui:row': {
            children: [
              {
                'ui:col': {
                  xs: 12,
                  sm: 6,
                  children: ['email'],
                },
              },
              {
                'ui:col': {
                  xs: 12,
                  sm: 6,
                  children: ['phone'],
                },
              },
            ],
          },
        },
      ],
    },
  },
};

const MyForm = () => <Form schema={schema} uiSchema={uiSchema} validator={validator} />;
```

The DaisyUI theme uses a flexible grid system based on Tailwind CSS's flex utilities. This grid layout integrates with the standard RJSF layout system, providing a consistent experience across all themes.

## Theme Configuration

DaisyUI itself provides a variety of themes. To use a specific theme, add the `data-theme` attribute to your root element:

```jsx
<div data-theme='dark'>
  <Form schema={schema} validator={validator} />
</div>
```

You can also dynamically change themes in your application:

```jsx
import { useState } from 'react';
import { Form } from '@rjsf/daisyui';
import validator from '@rjsf/validator-ajv8';

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <div data-theme={theme}>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value='light'>Light</option>
        <option value='dark'>Dark</option>
        <option value='cupcake'>Cupcake</option>
        <option value='cyberpunk'>Cyberpunk</option>
        <option value='synthwave'>Synthwave</option>
        {/* Add more themes as needed */}
      </select>

      <Form schema={schema} validator={validator} />
    </div>
  );
}
```

## Development

To develop locally:

```bash
# Clone the repository
git clone https://github.com/rjsf-team/react-jsonschema-form.git
cd react-jsonschema-form

# Install dependencies
npm install

# Build packages
npm run build

# Run playground
npm run start:playground
```

To test the DaisyUI theme specifically, select it from the themes dropdown in the playground.

## License

Apache-2.0

[build-shield]: https://github.com/rjsf-team/react-jsonschema-form/workflows/CI/badge.svg
[build-url]: https://github.com/rjsf-team/react-jsonschema-form/actions
[npm-shield]: https://img.shields.io/npm/v/@rjsf/daisyui/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/daisyui
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/daisyui.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/daisyui
[contributors-shield]: https://img.shields.io/github/contributors/rjsf-team/react-jsonschema-form.svg?style=flat-square
[contributors-url]: https://github.com/rjsf-team/react-jsonschema-form/graphs/contributors
[license-shield]: https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square
[license-url]: https://github.com/rjsf-team/react-jsonschema-form/blob/main/LICENSE
