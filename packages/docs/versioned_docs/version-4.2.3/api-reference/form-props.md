---
title: <Form /> props
---

# &lt;Form /> props

## acceptcharset

The value of this prop will be passed to the `accept-charset` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-accept-charset).

## action

The value of this prop will be passed to the `action` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-action).

Note that this just renders the `action` attribute in the HTML markup. There is no real network request being sent to this `action` on submit. Instead, react-jsonschema-form catches the submit event with `event.preventDefault()` and then calls the [`onSubmit`](#onSubmit) function, where you could send a request programmatically with `fetch` or similar.

## additionalMetaSchemas

This prop allows you to validate the form data against another JSON Schema meta schema, for example, JSON Schema draft-04. See [Validation](../usage/validation.md) for more information.

## ArrayFieldTemplate

React component used to customize how alls arrays are rendered on the form. See [Custom Templates](../advanced-customization/custom-templates.md) for more information.

## autoComplete

The value of this prop will be passed to the `autocomplete` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-autocomplete).

## autocomplete

Deprecated, same functionality as `autoComplete`

## className

The value of this prop will be passed to the `class` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).

## children

You can provide custom buttons to your form via the `Form` component's `children`. Otherwise a default submit button will be rendered.

```jsx
const schema = {
  type: "string"
};

render((
  <Form schema={schema}>
    <div>
      <button type="submit">Submit</button>
      <button type="button">Cancel</button>
    </div>
  </Form>
), document.getElementById("app"));
```

> **Warning:** There needs to be a button or an input with `type="submit"` to trigger the form submission (and then the form validation).

## customFormats

This prop allows you to define custom formats for validation. See [Validation](../usage/validation.md) for more information.

## disabled

It's possible to disable the whole form by setting the `disabled` prop. The `disabled` prop is then forwarded down to each field of the form.

```jsx
const schema = {
  type: "string"
};

render((
  <Form schema={schema}
        disabled />
), document.getElementById("app"));
```

If you just want to disable some of the fields, see the `ui:disabled` parameter in `uiSchema`.

## readonly

It's possible to make the whole form read-only by setting the `readonly` prop. The `readonly` prop is then forwarded down to each field of the form.

```jsx
const schema = {
  type: "string"
};

render((
  <Form schema={schema}
        readonly />
), document.getElementById("app"));
```

If you just want to make some of the fields read-only, see the `ui:readonly` parameter in `uiSchema`.

## enctype

The value of this prop will be passed to the `enctype` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-enctype).

## extraErrors

This prop allows passing in custom errors that are augmented with the existing JSON Schema errors on the form; it can be used to implement asynchronous validation. See [Validation](../usage/validation.md) for more information.

## ErrorList

You can pass a React component to this prop to customize how form errors are displayed. See [Validation](../usage/validation.md) for more information.

## fields

Dictionary of registered fields in the form. See [Custom Widgets and Fields](../advanced-customization/custom-widgets-fields.md) for more information.

## FieldTemplate

React component used to customize each field of the form. See [Custom Templates](../advanced-customization/custom-templates.md) for more information.

## formContext

You can provide a `formContext` object to the Form, which is passed down to all fields and widgets. Useful for implementing context aware fields and widgets.
Setting `{readonlyAsDisabled: false}` on the formContext will make the antd theme treat readOnly fields as disabled.

## formData

Often you'll want to prefill a form with existing data; this is done by passing a `formData` prop object matching the schema.

## id

The value of this prop will be passed to the `id` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).

## idPrefix

To avoid collisions with existing ids in the DOM, it is possible to change the prefix used for ids (the default is `root`).

```jsx
const schema = {
  type: "string"
};

render((
  <Form schema={schema}
        idPrefix={"rjsf_prefix"}/>
), document.getElementById("app"));
```

This will render `<input id="rjsf_prefix_key">` instead of `<input id="root_key">`

## idSeparator

To avoid using a path separator that is present in field names, it is possible to change the separator used for ids (the default is `_`).

```jsx
const schema = {
  type: "object",
  properties: {
    first: {
      type: "string"
    }
  }
};

render((
  <Form schema={schema}
        idSeparator={"/"}/>
), document.getElementById("app"));
```

This will render `<input id="root/first">` instead of `<input
id="root_first">` when rendering `first`.


## liveOmit

If `omitExtraData` and `liveOmit` are both set to true, then extra form data values that are not in any form field will be removed whenever `onChange` is called. Set to `false` by default.

## liveValidate

If set to true, the form will perform validation and show any validation errors whenever the form data is changed, rather than just on submit.

## method

The value of this prop will be passed to the `method` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-method).

## name

The value of this prop will be passed to the `name` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-name).

## noHtml5Validate

If set to true, turns off HTML5 validation on the form. Set to `false` on default.

## noValidate

If set to true, turns off all validation. Set to `false` by default.

## ObjectFieldTemplate

React component used to customize how all objects are rendered in the form. See [Custom Templates](../advanced-customization/custom-templates.md) for more information.

## omitExtraData

If set to true, then extra form data values that are not in any form field will be removed whenever `onSubmit` is called. Set to `false` by default.

## onBlur

Sometimes you may want to trigger events or modify external state when a field has been touched, so you can pass an `onBlur` handler, which will receive the id of the input that was blurred and the field value.

## onChange

If you plan on being notified every time the form data are updated, you can pass an `onChange` handler, which will receive the same args as `onSubmit` any time a value is updated in the form.

## onError

To react when submitted form data are invalid, pass an `onError` handler. It will be passed the list of encountered errors:

```jsx
const schema = {
  type: "string"
};
const onError = (errors) => console.log("I have", errors.length, "errors to fix");

render((
  <Form schema={schema}
        onError={onError} />
), document.getElementById("app"));
```

## onFocus

Sometimes you may want to trigger events or modify external state when a field has been focused, so you can pass an `onFocus` handler, which will receive the id of the input that is focused and the field value.

## onSubmit

You can pass a function as the `onSubmit` prop of your `Form` component to listen to when the form is submitted and its data are valid. It will be passed a result object having a `formData` attribute, which is the valid form data you're usually after. The original event will also be passed as a second parameter:

```jsx
const schema = {
  type: "string"
};
const onSubmit = ({formData}, e) => console.log("Data submitted: ",  formData);

render((
  <Form schema={schema}
        onSubmit={onSubmit} />
), document.getElementById("app"));
```

> Note: If there are fields in the `formData` that are not represented in the schema, they will be retained by default. If you would like to remove those extra values on form submission, you may need to set the `omitExtraData` and/or `liveOmit` props.

## schema

Form schema. We support JSON schema draft-07 by default. See [Schema Reference](https://json-schema.org/draft-07/json-schema-release-notes.html) for more information.

## showErrorList

When this prop is set to true, a list of errors (or the custom error list defined in the `ErrorList`) will also show. When set to false, only inline input validation errors will be shown. Set to `true` by default. See [Validation](../usage/validation.md) for more information.

## tagName

It's possible to change the default `form` tag name to a different HTML tag, which can be helpful if you are nesting forms. However, native browser form behaviour, such as submitting when the `Enter` key is pressed, may no longer work.

```jsx
<Form
  tagName="div"
/>
```

You can also provide a class/function component.


```jsx
const CustomForm = props => <form {...props} style={...} className={...} />
// ...
<Form
  tagName={CustomForm}
/>
```

## target

The value of this prop will be passed to the `target` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-target).

## transformErrors

A function can be passed to this prop in order to make modifications to the default errors resulting from JSON Schema validation. See [Validation](../usage/validation.md) for more information.

## uiSchema

Form uiSchema. See [uiSchema Reference](uiSchema.md) for more information.

## validate

The `validate` prop requires a function that specifies custom validation rules for the form. See [Validation](../usage/validation.md) for more information.

## widgets

Dictionary of registered widgets in the form. See [Custom Widgets and Fields](../advanced-customization/custom-widgets-fields.md) for more information.
