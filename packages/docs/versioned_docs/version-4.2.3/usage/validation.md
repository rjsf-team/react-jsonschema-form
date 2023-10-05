# Validation

When the form is submitted, the form data is validated to conform to the given JSON schema; this library uses the [ajv](https://github.com/ajv-validator/ajv) validator by default.

## Live validation

By default, form data are only validated when the form is submitted or when a new `formData` prop is passed to the `Form` component.

You can enable live form data validation by passing a `liveValidate` prop to the `Form` component, and set it to `true`. Then, every time a value changes within the form data tree (e.g. the user entering a character in a field), a validation operation is performed, and the validation results are reflected into the form state.

Be warned that this is an expensive strategy, with possibly strong impact on performances.

```jsx
const schema = {
  type: ["string"],
  const: "test"
};

const formData = "a";

render((
  <Form schema={schema} formData={formData} liveValidate />
), document.getElementById("app"));
```

## HTML5 Validation

By default, the form uses HTML5 validation. This may cause unintuitive results because the HTML5 validation errors (such as when a field is `required`) may be displayed before the form is submitted, and thus these errors will display differently from the react-jsonschema-form validation errors. You can turn off HTML validation by setting the `noHtml5Validate` to `true`.

```jsx
const schema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      required: true
    }
  }
};

render((
  <Form schema={schema} noHtml5Validate />
), document.getElementById("app"));
```

## Custom validation rules

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

## Custom error messages

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
- `params`: an object with the error params returned by ajv ([see doc](https://github.com/ajv-validator/ajv/tree/6a671057ea6aae690b5967ee26a0ddf8452c6297#error-parameters) for more info).
- `property`: a string in Javascript property accessor notation to the data path of the field with the error. For example, `.name` or `['first-name']`.
- `stack`: full error name, for example ".name is a required property".
- `schemaPath`: JSON pointer to the schema of the keyword that failed validation. For example, `#/fields/firstName/required`. (Note: this may sometimes be wrong due to a [bug in ajv](https://github.com/ajv-validator/ajv/issues/512)).

## Error List Display

To take control over how the form errors are displayed, you can define an *error list template* for your form. This list is the form global error list that appears at the top of your forms.

An error list template is basically a React stateless component being passed errors as props so you can render them as you like:

```jsx
function ErrorListTemplate(props) {
  const { errors } = props;
  return (
    <div>
      <h2>Custom error list</h2>
      <ul>
        {errors.map(error => (
            <li key={error.stack}>
              {error.stack}
            </li>
          ))}
      </ul>
    </div>
  );
}

const schema = {
  type: "string",
  const: "test"
};

render((
  <Form schema={schema}
        showErrorList={true}
        formData={""}
        liveValidate
        ErrorList={ErrorListTemplate} />
), document.getElementById("app"));
```

> Note: Your custom `ErrorList` template will only render when `showErrorList` is `true`.

The following props are passed to `ErrorList`

- `errors`: An array of the errors.
- `errorSchema`: The errorSchema constructed by `Form`.
- `schema`: The schema that was passed to `Form`.
- `uiSchema`: The uiSchema that was passed to `Form`.
- `formContext`: The `formContext` object that you passed to Form.


## The case of empty strings

When a text input is empty, the field in form data is set to `undefined`. String fields that use `enum` and a `select` widget will have an empty option at the top of the options list that when selected will result in the field being `undefined`.

One consequence of this is that if you have an empty string in your `enum` array, selecting that option in the `select` input will cause the field to be set to `undefined`, not an empty string.

If you want to have the field set to a default value when empty you can provide a `ui:emptyValue` field in the `uiSchema` object.

## Custom meta schema validation

To have your schemas validated against any other meta schema than draft-07 (the current version of [JSON Schema](http://json-schema.org/)), make sure your schema has a `$schema` attribute that enables the validator to use the correct meta schema. For example:

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  ...
}
```

Note that react-jsonschema-form only supports the latest version of JSON Schema, draft-07, by default. To support additional meta schemas pass them through the `additionalMetaSchemas` prop to the `Form` component.

### additionalMetaSchemas

The `additionalMetaSchemas` prop allows you to validate the form data against one (or more than one) JSON Schema meta schema, for example, JSON Schema draft-04. You can import a meta schema as follows:

```jsx
const metaSchemaDraft04 = require("ajv/lib/refs/json-schema-draft-04.json");
```

In this example `schema` passed as props to `Form` component can be validated against draft-07 (default) and by draft-04 (added), depending on the value of `$schema` attribute.

```jsx
const schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  type: "string"
};

return (<Form schema={schema} 
  additionalMetaSchemas={[metaSchemaDraft04]} />);
```

## customFormats

[Pre-defined semantic formats](https://json-schema.org/draft/2019-09/json-schema-validation.html#rfc.section.7) are limited. react-jsonschema-form adds two formats, `color` and `data-url`, to support certain [alternative widgets](../usage/widgets.md). You can add formats of your own through the `customFormats` prop to your `Form` component:

```jsx
const schema = {
  type: 'string',
  format: 'phone-us'
};

const customFormats = {
  'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/
};

render((
  <Form schema={schema} 
        customFormats={customFormats}/>
), document.getElementById("app"));
```

Format values can be anything AJV's [`addFormat` method](https://github.com/ajv-validator/ajv/tree/6a671057ea6aae690b5967ee26a0ddf8452c6297#addformatstring-name-stringregexpfunctionobject-format---ajv) accepts.

## Async validation

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
    }
  }
};

const extraErrors = {
  foo: {
    __errors: ["some error that got added as a prop"],
  },
  candy: {
    bar: {
    __errors: ["some error that got added as a prop"],
    }
  }
};

render((
  <Form schema={schema}
        extraErrors={extraErrors} />
), document.getElementById("app"));
```

An important note is that these errors are "display only" and will not block the user from submitting the form again.
