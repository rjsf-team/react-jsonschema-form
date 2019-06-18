## Form data validation

### Live validation

By default, form data are only validated when the form is submitted or when a new `formData` prop is passed to the `Form` component.

You can enable live form data validation by passing a `liveValidate` prop to the `Form` component, and set it to `true`. Then, everytime a value changes within the form data tree (eg. the user entering a character in a field), a validation operation is performed, and the validation results are reflected into the form state.

Be warned that this is an expensive strategy, with possibly strong impact on performances.

To disable validation entirely, you can set Form's `noValidate` prop to `true`.

### HTML5 Validation

By default, required field errors will cause the browser to display its standard HTML5 `required` attribute error messages and prevent form submission. If you would like to turn this off, you can set Form's `noHtml5Validate` prop to `true`, which will set `noValidate` on the `form` element.

### Custom validation

Form data is always validated against the JSON schema.

But it is possible to define your own custom validation rules. This is especially useful when the validation depends on several interdependent fields.

```js
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

### Custom string formats

[Pre-defined semantic formats](https://json-schema.org/latest/json-schema-validation.html#rfc.section.7) are limited. react-jsonschema-form adds two formats, `color` and `data-url`, to support certain [alternative widgets](form-customization.md#alternative-widgets). You can add formats of your own through the `customFormats` prop to your `Form` component:

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

### Custom schema validation

To have your schemas validated against any other meta schema than draft-07 (the current version of [JSON Schema](http://json-schema.org/)), make sure your schema has a `$schema` attribute that enables the validator to use the correct meta schema. For example:

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  ...
}
```

Note that react-jsonschema-form only supports the latest version of JSON Schema, draft-07, by default. To support additional meta schemas pass them through the `additionalMetaSchemas` prop to your `Form` component:

```jsx
const additionalMetaSchemas = require("ajv/lib/refs/json-schema-draft-04.json");

render((
  <Form schema={schema} 
        additionalMetaSchemas={[additionalMetaSchemas]}/>
), document.getElementById("app"));
```

In this example `schema` passed as props to `Form` component can be validated against draft-07 (default) and by draft-04 (added), depending on the value of `$schema` attribute.

`additionalMetaSchemas` also accepts more than one meta schema:

```jsx
render((
  <Form schema={schema} 
        additionalMetaSchemas={[metaSchema1, metaSchema2]} />
), document.getElementById("app"));
```

### Custom error messages

Validation error messages are provided by the JSON Schema validation by default. If you need to change these messages or make any other modifications to the errors from the JSON Schema validation, you can define a transform function that receives the list of JSON Schema errors and returns a new list.

```js
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

### Error List Display

To disable rendering of the error list at the top of the form, you can set the `showErrorList` prop to `false`. Doing so will still validate the form, but only the inline display will show.

```js
render((
  <Form schema={schema}
        showErrorList={false} />
), document.getElementById("app"));
```

> Note: you can also use your own [ErrorList](advanced-customization.md#error-list-template)

### The case of empty strings

When a text input is empty, the field in form data is set to `undefined`. String fields that use `enum` and a `select` widget will have an empty option at the top of the options list that when selected will result in the field being `undefined`.

One consequence of this is that if you have an empty string in your `enum` array, selecting that option in the `select` input will cause the field to be set to `undefined`, not an empty string.

If you want to have the field set to a default value when empty you can provide a `ui:emptyValue` field in the `uiSchema` object.
