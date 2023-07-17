# Quickstart

Let's walk through setup of a form after installing the dependency properly.

## Form schema

First, specify a schema using the [JSON Schema specification](https://json-schema.org/). The below schema renders a single string field:

```jsx
const schema = {
  title: "Test form",
  type: "string"
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

You can also render an object with multiple fields with the below schema:

```jsx
const schema = {
  title: "Test form",
  type: "object",
  properties: {
    name: {
      type: "string"
    },
    age: {
      type: "number"
    }
  }
};

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

For more information and examples of JSON Schema properties that this library supports, see [Using JSON Schema](./usage/single.md).

## Form uiSchema

The uiSchema is used to add more customization to the form's look and feel. Use the `classNames`
attribute of the uiSchema to add a custom CSS class name to the form:


```jsx
const schema = {
  title: "Test form",
  type: "string"
};

const uiSchema = {
  classNames: "custom-css-class"
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

To customize object fields in the uiSchema, the structure of the
uiSchema should be `{key: value}`, where `key` is the property key and `value` is an
object with the uiSchema configuration for that particular property. For example:

```jsx
const schema = {
  title: "Test form",
  type: "object",
  properties: {
    name: {
      type: "string"
    },
    age: {
      type: "number"
    }
  }
};

const uiSchema = {
  name: {
    classNames: "custom-class-name"
  },
  age: {
    classNames: "custom-class-age"
  }
}

render((
  <Form schema={schema} />
), document.getElementById("app"));
```

## Form initialization

Often you'll want to prefill a form with existing data; this is done by passing a `formData` prop object matching the schema:

```jsx
const schema = {
  type: "object",
  properties: {
    title: {
      type: "string"
    },
    done: {
      type: "boolean"
    }
  }
};

const formData = {
  title: "First task",
  done: true
};

render((
  <Form schema={schema}
        formData={formData} />
), document.getElementById("app"));
```

> Note: If your form has a single field, pass a single value to `formData`. ex: `formData="Charlie"`

> WARNING: If you have situations where your parent component can re-render, make sure you listen to the `onChange` event and update the data you pass to the `formData` attribute.

### Form event handlers

You can use event handlers such as `onChange`, `onError`, `onSubmit`, `onFocus`, and `onBlur` on the `<Form />` component; see the [Form Props Reference](/docs/api-reference/form-props.md) for more details.

### Controlled component

By default, `<Form />` is an [uncontrolled component](https://reactjs.org/docs/uncontrolled-components.html). To make it a controlled component, use the
`onChange` and `formData` props as in the below example:

```jsx
const App = () => {
  const [formData, setFormData] = React.useState(null);
  return (<Form
    schema={{type: "string"}}
    formData={formData}
    onChange={e => setFormData(e.formData)}
  />);
};

render((
  <App />
), document.getElementById("app"));
```
