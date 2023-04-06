# Internals

Miscellaneous internals of react-jsonschema-form are listed here.

## JSON Schema supporting status

This component follows [JSON Schema](http://json-schema.org/documentation.html) specs. We currently support JSON Schema-07 by default, but we also support other JSON schema versions through the [custom schema validation](../usage/validation.md#custom-meta-schema-validation) feature. Due to the limitation of form widgets, there are some exceptions as follows:

- `additionalItems` keyword for arrays

  This keyword works when `items` is an array. `additionalItems: true` is not supported because there's no widget to represent an item of any type. In this case it will be treated as no additional items allowed. `additionalItems` being a valid schema is supported.

- `anyOf`, `allOf`, and `oneOf`, or multiple `types` (i.e. `"type": ["string", "array"]`)

  The `anyOf` and `oneOf` keywords are supported; however, properties declared inside the `anyOf/oneOf` should not overlap with properties "outside" of the `anyOf/oneOf`.

  You can also use `oneOf` with [schema dependencies](../usage/dependencies.md#schema-dependencies) to dynamically add schema properties based on input data.

  The `allOf` keyword is supported; it uses [json-schema-merge-allof](https://github.com/mokkabonna/json-schema-merge-allof) to merge subschemas to render the final combined schema in the form. When these subschemas are incompatible, though (or if the library has an error merging it), the `allOf` keyword is dropped from the schema.

- `"additionalProperties":false` produces incorrect schemas when used with [schema dependencies](../usage/dependencies.md#schema-dependencies). This library does not remove extra properties, which causes validation to fail. It is recommended to avoid setting `"additionalProperties":false` when you use schema dependencies. See [#848](https://github.com/rjsf-team/react-jsonschema-form/issues/848) [#902](https://github.com/rjsf-team/react-jsonschema-form/issues/902) [#992](https://github.com/rjsf-team/react-jsonschema-form/issues/992)

## Handling of schema defaults

This library automatically fills default values defined in the [JSON Schema](http://json-schema.org/documentation.html) as initial values in your form. This also works for complex structures in the schema. If a field has a default defined, it should always appear as default value in form. This also works when using [schema dependencies](../usage/dependencies.md#schema-dependencies).

Since there is a complex interaction between any supplied original form data and any injected defaults, this library tries to do the injection in a way which keeps the original intention of the original form data.

Check out the defaults example on the [live playground](https://rjsf-team.github.io/react-jsonschema-form/) to see this in action.

### Merging of defaults into the form data

There are three different cases which need to be considered for the merging. Objects, arrays and scalar values. This library always deeply merges any defaults with the existing form data for objects.

This are the rules which are used when injecting the defaults:

- When there is a scalar in the form data, nothing is changed.
- When the value is `undefined` in the form data, the default is created in the form data.
- When the value is an object in the form data, the defaults are deeply merged into the form data, using the rules defined here for the deep merge.
- Then the value is an array in the form data, defaults are only injected in existing array items. No new array items will be created, even if the schema has minItems or additional items defined.

### Merging of defaults within the schema

In the schema itself, defaults of parent elements are propagated into children. So when you have a schema which defines a deeply nested object as default, these defaults will be applied to children of the current node. This also merges objects defined at different levels together with the "deeper" not having precedence. If the parent node defines properties, which are not defined in the child, they will be merged so that the default for the child will be the merged defaults of parent and child.

For arrays this is not the case. Defining an array, when a parent also defines an array, will be overwritten. This is only true when arrays are used in the same level, for objects within these arrays, they will be deeply merged again.

## Custom array field buttons

The `ArrayField` component provides a UI to add, copy, remove and reorder array items, and these buttons use [Bootstrap glyphicons](http://getbootstrap.com/components/#glyphicons).
If you don't use glyphicons but still want to provide your own icons or texts for these buttons, you can easily do so using CSS:

> NOTE this only applies to the `@rjsf/core` theme

```css
i.glyphicon {
  display: none;
}
.btn-add::after {
  content: 'Add';
}
.array-item-copy::after {
  content: 'Copy';
}
.array-item-move-up::after {
  content: 'Move Up';
}
.array-item-move-down::after {
  content: 'Move Down';
}
.array-item-remove::after {
  content: 'Remove';
}
```

## Submit form programmatically

You can use the reference to get your `Form` component and call the `submit` method to submit the form programmatically without a submit button.
This method will dispatch the `submit` event of the form, and the function, that is passed to `onSubmit` props, will be called.

```tsx
import { createRef } from 'react';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { Form } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const onSubmit = ({ formData }) => console.log('Data submitted: ', formData);
let yourForm;

const schema: RJSFSchema = {
  type: 'string',
};

const formRef = createRef<Form>();

render(
  <Form schema={schema} validator={validator} onSubmit={onSubmit} ref={formRef} />,
  document.getElementById('app')
);

formRef.current.submit();
```
