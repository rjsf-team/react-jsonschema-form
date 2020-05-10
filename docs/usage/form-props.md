# &lt;Form /> props

## acceptcharset

The value of this prop will be passed to the `accept-charset` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-accept-charset).

## action

The value of this prop will be passed to the `action` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).

## additionalMetaSchemas

This prop allows you to validate the form data against another JSON Schema meta schema, for example, JSON Schema draft-04.

```jsx
const additionalMetaSchemas = require("ajv/lib/refs/json-schema-draft-04.json");

const schema = {
  type: "string"
};

render((
  <Form schema={schema} 
        additionalMetaSchemas={[additionalMetaSchemas]}/>
), document.getElementById("app"));
```

In this example `schema` passed as props to `Form` component can be validated against draft-07 (default) and by draft-04 (added), depending on the value of `$schema` attribute.

`additionalMetaSchemas` also accepts more than one meta schema:

```jsx
<Form schema={schema} 
  additionalMetaSchemas={[metaSchema1, metaSchema2]} />
```

## ArrayFieldTemplate

React component used to customize how alls arrays are rendered on the form. See [Custom Templates](custom-templates.md) for more information.

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

[Pre-defined semantic formats](https://json-schema.org/draft/2019-09/json-schema-validation.html#rfc.section.7) are limited. react-jsonschema-form adds two formats, `color` and `data-url`, to support certain [alternative widgets](form-customization.md#alternative-widgets). You can add formats of your own through the `customFormats` prop to your `Form` component:

```jsx
const schema = {
  phoneNumber: {
    type: 'string',
    format: 'phone-us'
  }
};

const customFormats = {
  'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/
};

render((
  <Form schema={schema} 
        customFormats={customFormats}/>
), document.getElementById("app"));
```

Format values can be anything AJV’s [`addFormat` method](https://github.com/epoberezkin/ajv#addformatstring-name-stringregexpfunctionobject-format---ajv) accepts.

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

## enctype

The value of this prop will be passed to the `enctype` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-enctype).

## extraErrors

Handling async errors is an important part of many applications. Support for this is added in the form of the `extraErrors` prop.

For example, a request could be made to some backend when the user submits the form. If that request fails, the errors returned by the backend should be formatted like in the following example.

```jsx
const schema = {
  type: "object",
  properties: {
    foo: {
      type: "string",
    },
    candy: {
      type: "object",
      properties: {
        bar: {
          type: "string",
        }
      }
    },
  },
}

const extraErrors = {
  foo: {
    __errors: ["some error that got added as a prop"],
  },
  candy: {
    bar: {
    __errors: ["some error that got added as a prop"],
    }
  }
}

render((
  <Form schema={schema}
        extraErrors={extraErrors} />,
), document.getElementById("app"));
```

An important note is that these errors are 'display only' and will not block the user from submitting the form again.

## ErrorList

To take control over how the form errors are displayed, you can define an *error list template* for your form. This list is the form global error list that appears at the top of your forms.

An error list template is basically a React stateless component being passed errors as props so you can render them as you like:

```jsx
function ErrorListTemplate(props) {
  const {errors} = props;
  return (
    <ul>
      {errors.map(error => (
          <li key={error.stack}>
            {error.stack}
          </li>
        ))}
    </ul>
  );
}

const schema = {
  type: "string",
  minLength: 5,
  maxLength: 6,
  required: true
};

render((
  <Form schema={schema}
        showErrorList={true}
        ErrorList={ErrorListTemplate} />,
), document.getElementById("app"));
```

> Note: Your custom `ErrorList` template will only render when `showErrorList` is `true`.

The following props are passed to `ErrorList`

- `errors`: An array of the errors.
- `errorSchema`: The errorSchema constructed by `Form`.
- `schema`: The schema that was passed to `Form`.
- `uiSchema`: The uiSchema that was passed to `Form`.
- `formContext`: The `formContext` object that you passed to Form.

## fields

Dictionary of registered fields in the form. See [Custom Widgets and Fields](custom-widgets-fields.md) for more information.

## FieldTemplate

React component used to customize each field of the form. See [Custom Templates](custom-templates.md) for more information.

## formContext

You can provide a `formContext` object to the Form, which is passed down to all fields and widgets. Useful for implementing context aware fields and widgets.

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
        idPrefix={"rjsf_prefix"}/>,
), document.getElementById("app"));
```

This will render `<input id="rjsf_prefix_key">` instead of `<input id="root_key">`

## liveOmit

If `omitExtraData` and `liveOmit` are both set to true, then extra form data values that are not in any form field will be removed whenever `onChange` is called. Set to `false` by default.

## liveValidate

By default, form data are only validated when the form is submitted or when a new `formData` prop is passed to the `Form` component.

You can enable live form data validation by passing a `liveValidate` prop to the `Form` component, and set it to `true`. Then, everytime a value changes within the form data tree (eg. the user entering a character in a field), a validation operation is performed, and the validation results are reflected into the form state.

Be warned that this is an expensive strategy, with possibly strong impact on performances.

## method

The value of this prop will be passed to the `method` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).

## name

The value of this prop will be passed to the `name` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).

## noHtml5Validate

If set to true, turns off HTML5 validation on the form. Set to `false` on default.

## noValidate

If set to true, turns off all validation. Set to `false` by default.

## ObjectFieldTemplate

React component used to customize how all objects are rendered in the form. See [Custom Templates](custom-templates.md) for more information.

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

Form schema. We support JSON schema draft-07 by default. See [Schema Reference](api-reference-schema.md) for more information.

## showErrorList

When this prop is set to true, a list of errors (or the custom error list defined in the `ErrorList`) will also show. When set to false, only inline input validation errors will be shown. Set to `true` by default.

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

The value of this prop will be passed to the `target` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).

## transformErrors

Validation error messages are provided by the JSON Schema validation by default. If you need to change these messages or make any other modifications to the errors from the JSON Schema validation, you can define a transform function that receives the list of JSON Schema errors and returns a new list.

```jsx
function transformErrors(errors) {
  return errors.map(error => {
    if (error.name === "pattern") {
      error.message = "Only digits are allowed"
    }
    return error;
  });
}

const schema = {
  type: "object",
  properties: {
    onlyNumbersString: {type: "string", pattern: "^\\d*$"},
  }
};

render((
  <Form schema={schema}
        transformErrors={transformErrors} />
), document.getElementById("app"));
```

> Notes:
> - The `transformErrors()` function must return the list of errors. Modifying the list in place without returning it will result in an error.

Each element in the `errors` list passed to `transformErrors` has the following properties:

- `name`: name of the error, for example, "required" or "minLength"
- `message`: message, for example, "is a required property" or "should NOT be shorter than 3 characters"
- `params`: an object with the error params returned by ajv ([see doc](https://github.com/epoberezkin/ajv#error-parameters) for more info).
- `property`: a string in Javascript property accessor notation to the data path of the field with the error. For example, `.name` or `['first-name']`.
- `stack`: full error name, for example ".name is a required property".
- `schemaPath`: JSON pointer to the schema of the keyword that failed validation. For example, `#/fields/firstName/required`. (Note: this may sometimes be wrong due to a [https://github.com/epoberezkin/ajv/issues/512](bug in ajv)).

## uiSchema

Form uiSchema. See [uiSchema Reference](api-reference-uischema.md) for more information.

## validate

Form data is always validated against the JSON schema.

But it is possible to define your own custom validation rules. This is especially useful when the validation depends on several interdependent fields.

```jsx
function validate(formData, errors) {
  if (formData.pass1 !== formData.pass2) {
    errors.pass2.addError("Passwords don't match");
  }
  return errors;
}

const schema = {
  type: "object",
  properties: {
    pass1: {type: "string", minLength: 3},
    pass2: {type: "string", minLength: 3},
  }
};

render((
  <Form schema={schema}
        validate={validate} />
), document.getElementById("app"));
```

> Notes:
> - The `validate()` function must **always** return the `errors` object
>   received as second argument.
> - The `validate()` function is called **after** the JSON schema validation.

## widgets

Dictionary of registered widgets in the form. See [Custom Widgets and Fields](custom-widgets-fields.md) for more information.
