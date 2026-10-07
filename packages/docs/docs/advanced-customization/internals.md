# Internals

Miscellaneous internals of react-jsonschema-form are listed here.

## JSON Schema supporting status

This component follows [JSON Schema](http://json-schema.org/documentation.html) specs. We currently support JSON Schema-07 by default, but we also support other JSON schema versions through the [custom schema validation](../usage/validation.md#custom-meta-schema-validation) feature. Due to the limitation of form widgets, there are some exceptions as follows:

- `additionalItems` keyword for arrays

  This keyword works when `items` is an array. `additionalItems: true` is not supported because there's no widget to represent an item of any type. In this case it will be treated as no additional items allowed. `additionalItems` being a valid schema is supported.

- `anyOf`, `allOf`, and `oneOf`, or multiple `types` (i.e. `"type": ["string", "array"]`)

  The `anyOf` and `oneOf` keywords are supported; however, properties declared inside the `anyOf/oneOf` should not overlap with properties "outside" of the `anyOf/oneOf`.

  You can also use `oneOf` with [schema dependencies](../json-schema/dependencies.md#schema-dependencies) to dynamically add schema properties based on input data.

  The `allOf` keyword is supported; it uses [@x0k/json-schema-merge](https://github.com/x0k/json-schema-merge/) to merge subschemas to render the final combined schema in the form. When these subschemas are incompatible, though (or if the library has an error merging it), the `allOf` keyword is dropped from the schema.

- `"additionalProperties":false` produces incorrect schemas when used with [schema dependencies](../json-schema/dependencies.md#schema-dependencies). This library does not remove extra properties, which causes validation to fail. It is recommended to avoid setting `"additionalProperties":false` when you use schema dependencies. See [#848](https://github.com/rjsf-team/react-jsonschema-form/issues/848) [#902](https://github.com/rjsf-team/react-jsonschema-form/issues/902) [#992](https://github.com/rjsf-team/react-jsonschema-form/issues/992)

## Handling of schema defaults

This library automatically fills default values defined in the [JSON Schema](http://json-schema.org/documentation.html) as initial values in your form. This also works for complex structures in the schema. If a field has a default defined, it should always appear as default value in form. This also works when using [schema dependencies](../json-schema/dependencies.md#schema-dependencies).

Since there is a complex interaction between any supplied original form data and any injected defaults, this library tries to do the injection in a way which keeps the original intention of the original form data.

Check out the defaults example on the [live playground](https://rjsf-team.github.io/react-jsonschema-form/) to see this in action.

### Merging of defaults into the form data

There are three different cases which need to be considered for the merging. Objects, arrays and scalar values. This library always deeply merges any defaults with the existing form data for objects.

This are the rules which are used when injecting the defaults:

- When there is a scalar in the form data, nothing is changed.
- When the value is `undefined` in the form data, the default is created in the form data.
- When the value is an object in the form data, the defaults are deeply merged into the form data, using the rules defined here for the deep merge.
- Then the value is an array in the form data, defaults are only injected in existing array items. No new array items will be created, even if the schema has minItems or additional items defined.

A boolean property that is listed in its parent's `required` array and has no `default` of its own is populated with `false`. You can turn this off using the [`requiredBooleanDefault`](../api-reference/form-props.md#requiredbooleandefault) flag, so that the property stays `undefined` until the user answers it.

### Merging of defaults within the schema

In the schema itself, defaults of parent elements are propagated into children. So when you have a schema which defines a deeply nested object as default, these defaults will be applied to children of the current node. This also merges objects defined at different levels together, with the deeper (descendant) default taking precedence for any overlapping properties by default. You can change this behavior using the [`nestedDefaultsPrecedence`](../api-reference/form-props.md#nesteddefaultsprecedence) flag. If the parent node defines properties which are not defined in the child, they will be merged so that the default for the child will be the merged defaults of parent and child.

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

## The imperative handle

Use a ref when an action needs to read, update or submit the form programmatically. Type it as `FormRef<T>`, where `T` is your form-data type:

```tsx
const formRef = useRef<FormRef<MyData>>(null);
```

The handle exposes `getFormData()`, `submit()`, `reset()`, `setFieldValue()`, `validateForm()`, `validateFormWithFormData()`, `validate()` and `focusOnError()`. Form is a function component, so its ref does not expose class state or lifecycle methods.

## Read form data programmatically

Call `getFormData()` to read the current value without storing every `onChange` event yourself. For example, a self-owned form can save a draft from a button:

```tsx
import { useRef } from 'react';
import Form, { type FormRef } from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = { type: 'object', properties: { title: { type: 'string' } } };
type Draft = { title?: string };

function DraftEditor() {
  const formRef = useRef<FormRef<Draft>>(null);

  function saveDraft() {
    const data = formRef.current?.getFormData();
    localStorage.setItem('draft', JSON.stringify(data));
  }

  return (
    <>
      <Form ref={formRef} schema={schema} validator={validator} initialFormData={{ title: 'Untitled' }} />
      <button type="button" onClick={saveDraft}>Save draft</button>
    </>
  );
}
```

What you read depends on who owns the value:

- With `initialFormData`, Form stores edits immediately. `getFormData()` sees them even before React updates the inputs.
- With `formData`, your component owns the value. `getFormData()` returns the last value you passed back and React rendered, rather than an edit you have not accepted.

Inside `onChange`, use `event.formData` to read the edit being proposed. Treat data from both the event and the handle as read-only.

## Submit form programmatically

Call `submit()` from an event handler to run validation and invoke `onSubmit` with valid data, or `onError` with validation errors:

```tsx
import { useRef } from 'react';
import Form, { type FormRef } from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = { type: 'string' };

function Editor() {
  const formRef = useRef<FormRef<string>>(null);

  return (
    <>
      <Form
        ref={formRef}
        schema={schema}
        validator={validator}
        initialFormData=""
        onSubmit={({ formData }) => console.log('Data submitted:', formData)}
      />
      <button type="button" onClick={() => formRef.current?.submit()}>Save</button>
    </>
  );
}
```

In a self-owned form, a write followed by `submit()` submits the new value. If the inputs have not updated yet, the submit waits for React to render them, so native HTML constraint validation checks the value being submitted; `onSubmit` or `onError` is then called once React commits that render, rather than before `submit()` returns.

In a controlled form, let your component pass back the accepted value and let it render before submitting. Calling `setData(nextData)` and `submit()` in the same handler can submit the previous value. `validateForm()` also checks the current value; use `validateFormWithFormData(nextData)` to check a proposed value immediately without accepting or submitting it.

## Change form data programmatically

Use `setFieldValue(path, value)` to edit a field. The path can be a dotted string or an array of path segments. Use `''` or `[]` to replace the complete value, and pass `undefined` to clear a field.

```tsx
// Change one field.
formRef.current?.setFieldValue('address.city', 'Paris');
formRef.current?.setFieldValue(['address', 'city'], 'Paris');

// Replace the complete value with one edit.
formRef.current?.setFieldValue('', { address: { city: 'Paris', country: 'France' } });
```

A self-owned form stores the edit immediately. A controlled form proposes it through `onChange`; your handler decides what value to pass back through `formData`.

In a controlled form, several calls in one event build on each other: each proposal includes the edits proposed before it, until React renders the value your handler passed back. A handler that refuses a proposal still sees the refused edit in later proposals of the same event. You can also update parent state directly; that does not call Form's `onChange`.

## Command timing

Use event handlers for actions such as saving, resetting and validating. New `formData` belongs in the prop itself; it does not need an Effect that copies it into Form.

An existing integration may need to issue a command when props change. Use a passive `useEffect` for that synchronization. For example, a descendant receiving a stable `formRef` can validate when its supplied schema or data changes:

```tsx
useEffect(() => {
  formRef.current?.validateForm();
}, [formRef, schema, data]);
```

A command issued from a layout Effect, a callback ref or a class commit lifecycle of the commit that renders new props sees those props too: Form installs them into its store in an insertion Effect, which React runs before any of those, and also while an `<Activity>` hides the form. Only the cleanup of a layout Effect and a ref being detached run earlier, and still see Form's previous configuration.

Do not issue commands while rendering or from a validation function. React may repeat those calls or abandon the render.

Form stores edits synchronously through `useSyncExternalStore`. Wrapping a handle call in `startTransition()` does not make it non-blocking. See the [migration guide](../migration-guides/v7.x%20upgrade%20guide.md#function-form-and-synchronous-model-timing-breaking-change) for examples of timing-dependent code to update.
