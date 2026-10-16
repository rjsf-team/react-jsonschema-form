# Quickstart

Let's walk through setup of a form after installing the dependency properly.
NOTE: As of version 5, the `Form` now requires you to provide a `validator` implementation. We recommend the one from `@rjsf/validator-ajv8`.

## Form schema

First, specify a schema using the [JSON Schema specification](https://json-schema.org/). The below schema renders a single string field:

```tsx
import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  title: 'Test form',
  type: 'string',
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

You can also render an object with multiple fields with the below schema:

```tsx
import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  title: 'Test form',
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

For more information and examples of JSON Schema properties that this library supports, see [Using JSON Schema](json-schema/single.md).

## Form uiSchema

The uiSchema is used to add more customization to the form's look and feel. Use the `classNames`
attribute of the uiSchema to add a custom CSS class name to the form:

```tsx
import Form from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  title: 'Test form',
  type: 'string',
};

const uiSchema: UiSchema = {
  'ui:classNames': 'custom-css-class',
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

To customize object fields in the uiSchema, the structure of the
uiSchema should be `{key: value}`, where `key` is the property key and `value` is an
object with the uiSchema configuration for that particular property. For example:

```tsx
import Form from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  title: 'Test form',
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
};

const uiSchema: UiSchema = {
  name: {
    'ui:classNames': 'custom-class-name',
  },
  age: {
    'ui:classNames': 'custom-class-age',
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

## Form initialization

Often you'll want to prefill a form with existing data; this is done by passing an `initialFormData` prop object matching the schema:

```tsx
import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
    },
    done: {
      type: 'boolean',
    },
  },
};

const formData = {
  title: 'First task',
  done: true,
};

render(<Form schema={schema} initialFormData={formData} validator={validator} />, document.getElementById('app'));
```

> Note: If your form has a single field, pass a single value to `initialFormData`. ex: `initialFormData="Charlie"`

The form reads `initialFormData` when it mounts, so a parent re-rendering with it leaves the user's edits in place.

### Form event handlers

You can use event handlers such as `onChange`, `onError`, `onSubmit`, `onFocus`, and `onBlur` on the `<Form />` component; see the [Form Props Reference](./api-reference/form-props.md) for more details.

### Keeping a copy of the data

`<Form />` owns its data, as an [uncontrolled input](https://react.dev/reference/react-dom/components/input#providing-an-initial-value-for-an-input) does: `initialFormData` seeds it when the form mounts (the deprecated `formData` prop is another name for that seed). To keep a copy of the value in your own state, store what `onChange` reports, as in the below example. To show another record, remount the form under a `key`.

```tsx
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const App = () => {
  const [formData, setFormData] = React.useState<string>();
  return (
    <Form
      schema={{ type: 'string' }}
      initialFormData={formData}
      onChange={(e) => setFormData(e.formData)}
      validator={validator}
    />
  );
};

render(<App />, document.getElementById('app'));
```
