[Github](https://github.com/uswds/uswds)
[NPM](https://www.npmjs.com/package/uswds)
[jsDeliver](https://www.jsdelivr.com/package/npm/uswds)
[Website](https://designsystem.digital.gov/)

# @rjsf/uswds

USWDS theme, fields and widgets for [`react-jsonschema-form`](https://github.com/rjsf-team/react-jsonschema-form/).

## Installation

```bash
npm install @rjsf/core @rjsf/uswds @uswds/uswds react react-dom
```

## Prerequisites: USWDS CSS

**This package does not bundle USWDS CSS.** You must include the USWDS stylesheet in your project. Choose one method:

1.  **Import CSS/Sass:**
    ```javascript
    // In your application's entry point (e.g., index.js or App.js)
    import '@uswds/uswds/dist/css/uswds.min.css';

    // Or if using Sass:
    // @import "~@uswds/uswds/dist/scss/uswds"; // Adjust path as needed
    ```

2.  **Link in HTML:**
    ```html
    <!-- In your public/index.html or equivalent -->
    <link rel="stylesheet" href="/path/to/node_modules/@uswds/uswds/dist/css/uswds.min.css" />
    ```

## Usage

### Option 1: Use the themed Form component

This is the simplest way to use the theme.

```jsx
import Form from '@rjsf/uswds';
import validator from '@rjsf/validator-ajv8'; // Or your chosen validator

const MyForm = () => {
  const schema = { /* your schema */ };
  const uiSchema = { /* your uiSchema */ };
  const formData = { /* your data */ };

  return <Form schema={schema} uiSchema={uiSchema} formData={formData} validator={validator} />;
}

// Ensure USWDS CSS is loaded as described in Prerequisites.
```

### Option 2: Use `withTheme` for customization

If you need to customize the theme with your own widgets or fields:

```jsx
import { withTheme } from '@rjsf/core';
import { Theme as UswdsTheme } from '@rjsf/uswds';
import validator from '@rjsf/validator-ajv8';

// Optional: Define custom widgets/fields
const myWidgets = {
  // myCustomWidget: MyCustomWidgetComponent,
};

const myFields = {
  // myCustomField: MyCustomFieldComponent,
};

// Merge customizations with the USWDS theme
const MyTheme = {
  ...UswdsTheme,
  widgets: {
    ...UswdsTheme.widgets,
    ...myWidgets,
  },
  fields: {
    ...UswdsTheme.fields,
    ...myFields,
  },
};

const Form = withTheme(MyTheme);

const MyForm = () => {
  const schema = { /* your schema */ };
  return <Form schema={schema} validator={validator} />;
}

// Ensure USWDS CSS is loaded as described in Prerequisites.
```

## Specific Options

Currently, this theme primarily focuses on applying standard USWDS classes and structure. There are no theme-specific `uiSchema` options beyond those provided by `@rjsf/core`.

## Contributing

See the [main RJSF contributing guide](https://rjsf-team.github.io/react-jsonschema-form/docs/contributing/).
