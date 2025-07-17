---
title: <Form /> Props
---

# &lt;Form /> props

## acceptCharset

The value of this prop will be passed to the `accept-charset` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-accept-charset).

## action

The value of this prop will be passed to the `action` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-action).

Note that this just renders the `action` attribute in the HTML markup. There is no real network request being sent to this `action` on submit. Instead, react-jsonschema-form catches the submit event with `event.preventDefault()` and then calls the [`onSubmit`](#onSubmit) function, where you could send a request programmatically with `fetch` or similar.

## autoComplete

The value of this prop will be passed to the `autocomplete` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-autocomplete).

## className

The value of this prop will be passed to the `class` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).

## children

You can provide custom buttons to your form via the `Form` component's `children`. If no children are provided, by default a `Submit` button will be rendered.

For other ways to modify the default `Submit` button, see both the [Submit Button Options](./uiSchema.md#submitbuttonoptions) and the [SubmitButton Template](../advanced-customization/custom-templates.md#submitbutton) documentation.

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

render(
  <Form schema={schema} validator={validator}>
    <div>
      <button type='submit'>Submit</button>
      <button type='button'>Cancel</button>
    </div>
  </Form>,
  document.getElementById('app'),
);
```

> **Warning:** There needs to be a button or an input with `type="submit"` to trigger the form submission (and then the form validation).

## customValidate

Formerly the `validate` prop.
The `customValidate` prop requires a function that specifies custom validation rules for the form.
See [Validation](../usage/validation.md) for more information.

## experimental_defaultFormStateBehavior

Experimental features to specify different form state behavior.
Currently, this only affects the handling of optional array fields where `minItems` is set and handling of setting defaults based on the value of `emptyObjectFields`.

> **Warning:** This API is experimental and unstable, therefore breaking changes may be shipped in minor or patch releases. If you want to use this feature, we recommend pinning exact versions of `@rjsf/\*` packages in your package.json file or be ready to update your use of it when necessary.

The following subsections represent the different keys in this object, with the tables explaining the values and their meanings.

### `arrayMinItems`

This optional subsection is an object with two optional fields, `populate` and `mergeExtraDefaults`.
When not specified, it defaults to `{ populate: 'all', mergeExtraDefaults: false }`.

#### `arrayMinItems.populate`

Optional enumerated flag controlling how array minItems are populated, defaulting to `all`:

| Flag Value     | Description                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`          | Legacy behavior - populate minItems entries with default values initially and include empty array when no values have been defined.                |
| `requiredOnly` | Ignore `minItems` on a field when calculating defaults unless the field is required.                                                               |
| `never`        | Ignore `minItems` on a field when calculating defaults for required and non-required. Value will set only if defined `default` and from `formData` |

#### `arrayMinItems.computeSkipPopulate`

The signature and documentation for this property is as follow:

##### computeSkipPopulate &lt;T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

A function that determines whether to skip populating the array with default values based on the provided validator, schema, and root schema.
If the function returns `true`, the array will not be populated with default values.
If the function returns `false`, the array will be populated with default values according to the `populate` option.

###### Parameters

- validator: ValidatorType&lt;T, S, F> - An implementation of the `ValidatorType` interface that is used to detect valid schema conditions
- schema: S - The schema for which resolving a condition is desired
- [rootSchema]: S - The root schema that will be forwarded to all the APIs

###### Returns

- boolean: A boolean indicating whether to skip populating the array with default values.

##### Example

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    stringArray: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    numberArray: {
      type: 'array',
      items: { type: 'number' },
      minItems: 1,
    },
  },
  required: ['stringArray', 'numberArray'],
};

const computeSkipPopulateNumberArrays = (validator, schema, rootSchema) =>
  // These conditions are needed to narrow down the type of the schema.items
  !Array.isArray(schema?.items) &&
  typeof schema?.items !== 'boolean' &&
  schema?.items?.type === 'number',

render(
  <Form
    schema={schema}
    validator={validator}
    experimental_defaultFormStateBehavior={{
      arrayMinItems: {
        computeSkipPopulate: computeSkipPopulateNumberArrays,
      },
    }}
  />,
  document.getElementById('app')
);
```

#### `arrayMinItems.mergeExtraDefaults`

Optional boolean flag, defaulting to `false` when not specified.
When `formData` is provided and does not contain `minItems` worth of data, this flag controls whether the extra data provided by the defaults is appended onto the existing `formData` items to ensure the `minItems` condition is met.
When `false` (legacy behavior), only the `formData` provided is merged into the default form state, even if there are fewer than the `minItems`.
When `true`, the defaults are appended onto the end of the `formData` until the `minItems` condition is met.

### `emptyObjectFields`

Optional enumerated flag controlling how empty object fields are populated, defaulting to `populateAllDefaults`:

| Flag Value                 | Description                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `populateAllDefaults`      | Legacy behavior - set default when there is a primitive value, an non-empty object field, or the field itself is required   |
| `populateRequiredDefaults` | Only sets default when a value is an object and its parent field is required, or it is a primitive value and it is required |
| `skipDefaults`             | Does not set defaults                                                                                                       |
| `skipEmptyDefaults`        | Does not set an empty default. It will still apply the default value if a default property is defined in your schema        |

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: { type: 'string' },
  minItems: 3,
};

render(
  <Form
    schema={schema}
    validator={validator}
    experimental_defaultFormStateBehavior={{
      emptyObjectFields: 'populateRequiredDefaults',
    }}
  />,
  document.getElementById('app'),
);
```

### `allOf`

Optional enumerated flag controlling how empty defaults are populated when `allOf` schemas are provided, defaulting to `skipDefaults`:

| Flag Value         | Description                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `skipDefaults`     | Skip parsing defaults from `allOf` schemas                                                   |
| `populateDefaults` | Generate default values for properties in the `allOf` schema including `if-then-else` syntax |

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  title: 'Example',
  type: 'object',
  properties: {
    animalInfo: {
      properties: {
        animal: {
          type: 'string',
          default: 'Cat',
          enum: ['Cat', 'Fish'],
        },
      },
      allOf: [
        {
          if: {
            properties: {
              animal: {
                const: 'Cat',
              },
            },
          },
          then: {
            properties: {
              food: {
                type: 'string',
                default: 'meat',
                enum: ['meat', 'grass', 'fish'],
              },
            },
            required: ['food'],
          },
        },
      ],
    },
  },
};

render(
  <Form
    schema={schema}
    validator={validator}
    experimental_defaultFormStateBehavior={{
      allOf: 'populateDefaults',
    }}
  />,
  document.getElementById('app'),
);
```

### constAsDefaults

Optional enumerated flag controlling how const values are merged into the form data as defaults when dealing with undefined values, defaulting to `always`.
The defaulting behavior for this flag will always be controlled by the `emptyObjectField` flag value.
For instance, if `populateRequiredDefaults` is set and the const value is not required, it will not be set.

| Flag Value  | Description                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `always`    | A const value will always be merged into the form as a default. If there is are const values in a `oneOf` (for instance to create an enumeration with title different from the values), the first const value will be defaulted |
| `skipOneOf` | If const is in a `oneOf` it will NOT pick the first value as a default                                                                                                                                                          |
| `never`     | A const value will never be used as a default                                                                                                                                                                                   |

### mergeDefaultsIntoFormData

Optional enumerated flag controlling how the defaults are merged into the form data when dealing with undefined values, defaulting to `useFormDataIfPresent`.

NOTE: If there is a default for a field and the `formData` is unspecified, the default ALWAYS merges.

| Flag Value                      | Description                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `useFormDataIfPresent`          | Legacy behavior - Do not merge defaults if there is a value for a field in `formData` even if that value is explicitly set to `undefined` |
| `useDefaultIfFormDataUndefined` | If the value of a field within the `formData` is `undefined`, then use the default value instead                                          |

## experimental_customMergeAllOf

The `experimental_customMergeAllOf` function allows you to provide a custom implementation for merging `allOf` schemas. This can be particularly useful in scenarios where the default [json-schema-merge-allof](https://github.com/mokkabonna/json-schema-merge-allof) library becomes a performance bottleneck, especially with large and complex schemas or doesn't satisfy your needs.

By providing your own implementation, you can potentially achieve significant performance improvements. For instance, if your use case only requires a subset of JSON Schema features, you can implement a faster, more tailored merging strategy.

If you're looking for alternative `allOf` merging implementations, you might consider [allof-merge](https://github.com/udamir/allof-merge).

**Warning:** This is an experimental feature. Only use this if you fully understand the implications of custom `allOf` merging and are prepared to handle potential edge cases. Incorrect implementations may lead to unexpected behavior or validation errors.

```tsx
import { Form } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const customMergeAllOf = (schema: RJSFSchema): RJSFSchema => {
  // Your custom implementation here
};

render(
  <Form schema={schema} validator={validator} experimental_customMergeAllOf={customMergeAllOf} />,
  document.getElementById('app'),
);
```

## disabled

It's possible to disable the whole form by setting the `disabled` prop. The `disabled` prop is then forwarded down to each field of the form.

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

render(<Form schema={schema} validator={validator} disabled />, document.getElementById('app'));
```

If you just want to disable some fields, see the `ui:disabled` parameter in `uiSchema`.

## readonly

It's possible to make the whole form read-only by setting the `readonly` prop. The `readonly` prop is then forwarded down to each field of the form.

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

render(<Form schema={schema} validator={validator} readonly />, document.getElementById('app'));
```

If you just want to make some fields read-only, see the `ui:readonly` parameter in `uiSchema`.

## enctype

The value of this prop will be passed to the `enctype` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-enctype).

## extraErrors

This prop allows passing in custom errors that are augmented with the existing JSON Schema errors on the form; it can be used to implement asynchronous validation.
By default, these are non-blocking errors, meaning that you can still submit the form when these are the only errors displayed to the user.
See [Validation](../usage/validation.md) for more information.

## extraErrorsBlockSubmit

If set to true, causes the `extraErrors` to become blocking when the form is submitted.

## fields

Dictionary of registered fields in the form. See [Custom Widgets and Fields](../advanced-customization/custom-widgets-fields.md) for more information.

## focusOnFirstError

If set to true, then the first field with an error will receive the focus when the form is submitted with errors.

You can also provide a custom callback function to handle what happens when this function is called.

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema, RJSFValidationError } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

const focusOnError = (error: RJSFValidationError) => {
  console.log('I need to handle focusing this error');
};

render(<Form schema={schema} validator={validator} focusOnFirstError={focusOnError} />, document.getElementById('app'));
```

## formContext

You can provide a `formContext` object to the Form, which is passed down to all fields and widgets. Useful for implementing context aware fields and widgets.

See [AntD Customization](themes/antd/uiSchema.md#formcontext) for formContext customizations for the `antd` theme.
See [Semantic UI Customization](themes/semantic-ui/uiSchema.md#formcontext) for formContext customizations for the `semantic-ui` theme.

## formData

Often you'll want to prefill a form with existing data; this is done by passing a `formData` prop object matching the schema.

## id

The value of this prop will be passed to the `id` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).

## idPrefix

To avoid collisions with existing ids in the DOM, it is possible to change the prefix used for ids (the default is `root`).

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

render(<Form schema={schema} validator={validator} idPrefix={'rjsf_prefix'} />, document.getElementById('app'));
```

This will render `<input id="rjsf_prefix_key">` instead of `<input id="root_key">`

## idSeparator

To avoid using a path separator that is present in field names, it is possible to change the separator used for ids (the default is `_`).

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    first: {
      type: 'string',
    },
  },
};

render(<Form schema={schema} validator={validator} idSeparator={'/'} />, document.getElementById('app'));
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

If set to true, turns off HTML5 validation on the form. Set to `false` by default.

## noValidate

If set to true, turns off all validation. Set to `false` by default.

## omitExtraData

If set to true, then extra form data values that are not in any form field will be removed whenever `onSubmit` is called. Set to `false` by default.

## onBlur

Sometimes you may want to trigger events or modify external state when a field has been touched, so you can pass an `onBlur` handler, which will receive the id of the input that was blurred and the field value.

## onChange

If you plan on being notified every time the form data are updated, you can pass an `onChange` handler, which will receive the same first argument as `onSubmit` any time a value is updated in the form.
It will also receive, as the second argument, the `id` of the field which experienced the change.
Generally, this will be the `id` of the field for which input data is modified.
In the case of adding/removing of new fields in arrays or objects with `additionalProperties` or `patternProperties` and the rearranging of items in arrays, the `id` will be that of the array or object itself, rather than the item/field being added, removed or moved.

## onError

To react when submitted form data are invalid, pass an `onError` handler. It will be passed the list of encountered errors:

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};
const onError = (errors) => console.log('I have', errors.length, 'errors to fix');

render(<Form schema={schema} validator={validator} onError={onError} />, document.getElementById('app'));
```

## onFocus

Sometimes you may want to trigger events or modify external state when a field has been focused, so you can pass an `onFocus` handler, which will receive the id of the input that is focused and the field value.

## onSubmit

You can pass a function as the `onSubmit` prop of your `Form` component to listen to when the form is submitted and its data are valid.
It will be passed a result object having a `formData` attribute, which is the valid form data you're usually after.
The original event will also be passed as a second parameter:

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};
const onSubmit = ({ formData }, e) => console.log('Data submitted: ', formData);

render(<Form schema={schema} validator={validator} onSubmit={onSubmit} />, document.getElementById('app'));
```

> Note: If there are fields in the `formData` that are not represented in the schema, they will be retained by default. If you would like to remove those extra values on form submission, you may need to set the `omitExtraData` and/or `liveOmit` props.

## schema

**Required**! Form schema. We support JSON schema draft-07 by default. See [Schema Reference](https://json-schema.org/draft-07/json-schema-release-notes.html) for more information.

## showErrorList

When this prop is set to `top` or `bottom`, a list of errors (or the custom error list defined in the `ErrorList`) will also show at the `bottom` or `top` of the form. When set to false, only inline input validation errors will be shown. Set to `top` by default. See [Validation](../usage/validation.md) for more information.

## tagName

It's possible to change the default `form` tag name to a different HTML tag, which can be helpful if you are nesting forms. However, native browser form behaviour, such as submitting when the `Enter` key is pressed, may no longer work.

```tsx
<Form
  tagName="div"
  ...
/>
```

You can also provide a class/function component.

```tsx
const CustomForm = props => <form {...props} style={...} className={...} />
// ...
<Form
  tagName={CustomForm}
  ...
/>
```

## target

The value of this prop will be passed to the `target` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-target).

## templates

Dictionary of registered templates in the form. See [Custom Templates](../advanced-customization/custom-templates.md) for more information.

## transformErrors

A function can be passed to this prop in order to make modifications to the default errors resulting from JSON Schema validation. See [Validation](../usage/validation.md) for more information.

## translateString

Optional string translation function, if provided, allows users to change the translation of the RJSF internal strings.
Some strings contain replaceable parameter values as indicated by `%1`, `%2`, etc.
The number after the `%` indicates the order of the parameter.
The ordering of parameters is important because some languages may choose to put the second parameter before the first in its translation. In addition to replaceable parameters, some of the strings support the use of markdown and simple html.

One can use the [documentation](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/enums.ts) of the `TranslatableString` enums to determine which enum values contain replaceable parameters and which support markdown and simple html.

One could use this function to alter one or more of the existing english strings to better suit one's application or fully translate all strings into a different language.
Below is an example of changing a few of the english strings to something else:

```ts
import { TranslatableString, englishStringTranslator, replaceStringParameters } from '@rjsf/utils';

function fixupSomeEnglishStrings(stringToTranslate: TranslatableString, params?: string[]): string {
  switch (stringToTranslate) {
    case TranslatableString.NewStringDefault:
      return ''; // Use an empty string for the new additionalProperties string default value
    case TranslatableString.KeyLabel:
      return replaceStringParameters('%1 Key Name', params); // Add "Name" onto the end of the WrapIfAdditionalTemplate key label
    default:
      return englishStringTranslator(stringToTranslate, params); // Fallback to the default english
  }
}
```

## uiSchema

Form uiSchema. See [uiSchema Reference](uiSchema.md) for more information.

## validator

**Required**! An implementation of the `ValidatorType` interface that is needed for form validation to work.
`@rjsf/validator-ajv8` exports the implementation of this interface from RJSF version 4.

## widgets

Dictionary of registered widgets in the form. See [Custom Widgets and Fields](../advanced-customization/custom-widgets-fields.md) for more information.
