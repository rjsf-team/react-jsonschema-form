Let's walk through setup of a form after installing the dependency properly.

## Form schema

## Form uiSchema

## Form initialization

Often you'll want to prefill a form with existing data; this is done by passing a `formData` prop object matching the schema:

```jsx
const formData = {
  title: "First task",
  done: true
};

render((
  <Form schema={schema}
        formData={formData} />
), document.getElementById("app"));
```

> Note: If your form has a single field, pass a single value to `formData`. ex: `formData='Charlie'`

> WARNING: If you have situations where your parent component can re-render, make sure you listen to the `onChange` event and update the data you pass to the `formData` attribute.

### Form event handlers

You can use event handlers such as `onChange`, `onError`, `onSubmit`, `onFocus`, and `onBlur` on the `<Form />` component; see the [Form Props Reference](api-reference-props.md) for more details.
