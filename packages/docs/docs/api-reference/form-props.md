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

Pass a stable reference: a function recreated on every render of the parent counts as a changed prop, which re-derives the form's state and, with `liveValidate: 'onChange'`, re-validates the current data on every parent render. Wrap it in `useCallback` or define it outside the render function.

Keep it pure. The form calls it while React renders whenever the errors on screen have to follow the props, for example when a new `schema` is validated live, so it follows [React's rules for rendering](https://react.dev/reference/rules/components-and-hooks-must-be-pure): no side effects, the same result for the same arguments, and no reliance on being called once, since React can render more than once (Strict Mode does in development) or discard a render.

## defaultFormStateBehavior

Experimental features to specify different form state behavior.
Currently, this only affects the handling of optional array fields where `minItems` is set and handling of setting defaults based on the value of `emptyObjectFields`.

> **Warning:** This API is experimental and unstable, therefore breaking changes may be shipped in minor or patch releases. If you want to use this feature, we recommend pinning exact versions of `@rjsf/\*` packages in your package.json file or be ready to update your use of it when necessary.

The following subsections represent the different keys in this object, with the tables explaining the values and their meanings.

### arrayMinItems

This optional subsection is an object with two optional fields, `populate` and `mergeExtraDefaults`.
When not specified, it defaults to `{ populate: 'all', mergeExtraDefaults: false }`.

#### arrayMinItems.populate

Optional enumerated flag controlling how array minItems are populated, defaulting to `all`:

| Flag Value     | Description                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`          | Legacy behavior - populate minItems entries with default values initially and include empty array when no values have been defined.                |
| `requiredOnly` | Ignore `minItems` on a field when calculating defaults unless the field is required.                                                               |
| `never`        | Ignore `minItems` on a field when calculating defaults for required and non-required. Value will set only if defined `default` and from `formData` |

#### arrayMinItems.computeSkipPopulate

The signature and documentation for this property is as follow:

##### computeSkipPopulate &lt;S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

A function that determines whether to skip populating the array with default values based on the provided `SchemaContext`, schema, and root schema.
If the function returns `true`, the array will not be populated with default values.
If the function returns `false`, the array will be populated with default values according to the `populate` option.

Replacing the callback alone does not take effect: the form compares a new `defaultFormStateBehavior` against the one it holds, and that comparison treats any two functions as equal, so a form keeps calling the callback it was first given until some other setting, the `validator` or the `schema` changes.
Define the behavior the callback needs from its `schema` and `rootSchema` arguments rather than from values captured when it was created, since a callback closing over changing state goes stale.

###### Parameters

- context: SchemaContext&lt;S, F> - The [`SchemaContext`](./utility-functions.md#types) in effect, holding the form's `validator`, `customMergeAllOf` and `defaultFormStateBehavior`; pass it along to any schema function the callback calls. Within a `oneOf` of a primitive type under `constAsDefaults: 'skipOneOf'`, its `constAsDefaults` is `'never'`
- schema: S - The array schema whose defaults are being computed
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

const computeSkipPopulateNumberArrays = (context, schema, rootSchema) =>
  // These conditions are needed to narrow down the type of the schema.items
  !Array.isArray(schema?.items) &&
  typeof schema?.items !== 'boolean' &&
  schema?.items?.type === 'number';

render(
  <Form
    schema={schema}
    validator={validator}
    defaultFormStateBehavior={{
      arrayMinItems: {
        computeSkipPopulate: computeSkipPopulateNumberArrays,
      },
    }}
  />,
  document.getElementById('app')
);
```

#### arrayMinItems.mergeExtraDefaults

Optional boolean flag, defaulting to `false` when not specified.
When `formData` is provided and does not contain `minItems` worth of data, this flag controls whether the extra data provided by the defaults is appended onto the existing `formData` items to ensure the `minItems` condition is met.
When `false` (legacy behavior), only the `formData` provided is merged into the default form state, even if there are fewer than the `minItems`.
When `true`, the defaults are appended onto the end of the `formData` until the `minItems` condition is met.

### emptyObjectFields

Optional enumerated flag controlling how empty object fields are populated, defaulting to `populateAllDefaults`:

| Flag Value                 | Description                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `populateAllDefaults`      | Legacy behavior - set default when there is a primitive value, an non-empty object field, or the field itself is required   |
| `populateRequiredDefaults` | Only sets default when a value is an object and its parent field is required, or it is a primitive value and it is required |
| `skipDefaults`             | Does not set defaults                                                                                                       |
| `skipEmptyDefaults`        | Does not set an empty default. It will still apply the default value if a default property is defined in your schema        |

A required boolean these flags leave unset, under `skipDefaults`, or under `populateRequiredDefaults` where the object holding it is optional, is reported missing by validation once the object holding it has a value, as the form's root always does. An optional object left empty is left out of the data, so until then nothing reports it. Either way its checkbox, like that of any required boolean whose schema doesn't demand `true`, isn't marked required, as [`requiredBooleanDefault`](#requiredbooleandefault) explains.

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
    defaultFormStateBehavior={{
      emptyObjectFields: 'populateRequiredDefaults',
    }}
  />,
  document.getElementById('app'),
);
```

### allOf

Optional enumerated flag controlling how empty defaults are populated when `allOf` schemas are provided, defaulting to `skipDefaults`:

| Flag Value         | Description                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `skipDefaults`     | Skip parsing defaults from `allOf` schemas nested inside the schema defaults are computed from, with the exceptions below |
| `populateDefaults` | Generate default values for properties in the `allOf` schema including `if-then-else` syntax                              |

`skipDefaults` only skips the `allOf` schemas nested inside the schema that defaults are computed from, not that schema's own `allOf`.
Which schema that is depends on what the form is doing:

- When the form computes defaults from the root schema, a root-level `allOf` provides its defaults with either value.
- Some actions compute defaults from a subschema as if it were the root, such as adding an array item or optional data, or switching a `oneOf` or `anyOf` option, so that subschema's own `allOf` provides its defaults with either value. When switching options, though, the `if` of an `if-then-else` in the new option's `allOf` is checked against the data of the option being left, so under `skipDefaults` its `then` default is filled in only when that data matches the `if`.
- The option picked on the initial render is not computed as if it were the root, even when its `oneOf` or `anyOf` is in the root schema, so under `skipDefaults` its `allOf` is left out until the user switches away from that option and back.

The branch of an `if-then-else` is picked from the form data, not from the computed defaults, except in a `dependencies` entry, as the last item below says:

- When the `if` lists a property in `required` and only a default provides that property, the `then` default is left out until the form data holds the value, for instance on the initial render.
- Without `required`, a missing property still satisfies the `if`'s `properties`, so such an `if` passes with no data, and its `then` default is filled in even when the `if` does not match the defaulted value.
- With one `allOf` entry per `enum` value and no form data, the default `allOf` merger merges the `then` defaults of all the entries, and the first entry that defaults a property wins. A `customMergeAllOf` that throws on the conflicting `default`s drops the whole `allOf` instead.

An `allOf` in an object property or in an array's `items` is skipped as a whole, plain property defaults included, so it usually needs `populateDefaults` to provide its defaults.
This is specific to `allOf`:

- An `if-then-else` placed directly in a nested object schema is resolved with either value, unless `emptyObjectFields` is `skipEmptyDefaults`. For example, under `skipDefaults`, `items: { type: 'object', if, then }` fills in the `then` default, while `items: { type: 'object', allOf: [{ if, then }] }` does not.
- Adding a direct `if` to that `items` schema resolves its whole `allOf` too, unless `emptyObjectFields` is `skipEmptyDefaults`.
- A `customMergeAllOf` built on a deep merger, such as `createDeepAllOfMerge` from `@x0k/json-schema-merge`, changes none of this. It may also flatten the `allOf` of the properties inside the `allOf` it merges, but each property's defaults are computed from the property as the schema declares it, so a property's `allOf` is skipped under `skipDefaults` as any other nested `allOf` is.
- A `dependencies` entry in a nested object schema is resolved once its property has a value, its `allOf` and `if-then-else` included, even when `emptyObjectFields` is `skipEmptyDefaults`. A default counts as that value, and the entry's `if` is checked against it, so an `if` that lists the property in `required` passes with no form data, while one that does not match the default fails. For example, under `skipDefaults`, `items: { type: 'object', properties: { animal: { default: 'Cat' } }, dependencies: { animal: { allOf: [{ if, then }] } } }` fills in the `then` default. A root `dependencies` entry counts a default too, whatever else the form data holds.

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
    defaultFormStateBehavior={{
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

### nestedDefaultsPrecedence

Optional enumerated flag controlling how defaults defined on multiple levels are merged together for overlapping properties, defaulting to `descendantWins`.

| Flag Value       | Description                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `descendantWins` | The innermost (descendant) default value definition takes precedence over its ancestor's defaults |
| `ancestorWins`   | The outermost (ancestor) default value definition takes precedence over any descendant's defaults |

#### Example

In the following example, the `animal` property is a descendant of the root schema and both define a default value for `animal`. By default, the `animal`'s default value `Cat` would take precedence over its ancestor's `Fish`. However, since `nestedDefaultsPrecedence` is set to `ancestorWins`, the root schema's default value takes precedence and `animal` is set to `Fish` by default.

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  default: {
    animal: 'Fish',
  },
  properties: {
    animal: {
      type: 'string',
      default: 'Cat',
      enum: ['Cat', 'Fish'],
    },
  },
};

render(
  <Form
    schema={schema}
    validator={validator}
    defaultFormStateBehavior={{
      nestedDefaultsPrecedence: 'ancestorWins',
    }}
  />,
  document.getElementById('app'),
);
```

### requiredBooleanDefault

Optional enumerated flag controlling whether a boolean listed in its parent's `required` array, with no `default` of its own, is populated with `false`, defaulting to `populateFalse`.
An explicit schema `default`, a parent default and an existing `formData` value always take precedence; this flag only decides what happens when none of them provides a value.

| Flag Value      | Description                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `populateFalse` | A required boolean with no `default` is set to `false`                                                                        |
| `skip`          | No value is synthesized; the property stays `undefined` until the user answers it, so `required` remains a validation concern |

#### Example

In the following example, `agree` is required but has no `default`. By default it would start as `false`, so [`getFormData()`](../advanced-customization/internals.md#read-form-data-programmatically) would return `{ agree: false }` before the user touched it. With `requiredBooleanDefault` set to `skip`, the data stays `{}` until the user answers, and validation reports `agree` as missing until then. This is the behavior to choose when a boolean question is rendered with an explicit "unanswered" state, for example a `- - -` / Yes / No select, rather than a checkbox.
A checkbox isn't marked required, by its `*` or a native `required`, unless its schema demands `true`, whatever this flag is: a native `required` would block the `false` an unchecked box holds, whether `populateFalse` filled it in or a user gave it by unchecking the box. Under `skip` it also has no unanswered state to show, so validation alone reports it missing, and only once the object holding it has a value, since an optional object left empty is left out of the data.
The same holds wherever [`emptyObjectFields`](#emptyobjectfields) leaves a required boolean unset: under `skipDefaults`, and under `populateRequiredDefaults` where the object holding it is optional.

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    agree: {
      type: 'boolean',
      title: 'Do you agree?',
    },
  },
  required: ['agree'],
};

render(
  <Form
    schema={schema}
    validator={validator}
    defaultFormStateBehavior={{
      requiredBooleanDefault: 'skip',
    }}
  />,
  document.getElementById('app'),
);
```

## customMergeAllOf

The `customMergeAllOf` function allows you to provide a custom implementation for merging `allOf` schemas. This can be particularly useful in case the where the default merge library ([@x0k/json-schema-merge](https://github.com/x0k/json-schema-merge/)) doesn't satisfy your functional or performance requirements.

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
  <Form schema={schema} validator={validator} customMergeAllOf={customMergeAllOf} />,
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
By default, these errors block form submission just like JSON Schema errors do.
See [Validation](../usage/validation.md) for more information.

## extraErrorsAreWarnings

If set to true, treats `extraErrors` as warnings instead of blocking form submission.

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

## formData

Deprecated: use [`initialFormData`](#initialformdata), which this is another name for. The form reads it only when it mounts and when `reset()` is called, which the name `formData` hides by reading as a controlled value.

It seeds the form exactly as `initialFormData` does, and nothing more. When both are passed, `formData` is the seed, and in development the form warns once that `initialFormData` is ignored.

The form owns its data after it mounts. The usual v6 pattern keeps working, since the value `onChange` reports is the form's own and passing it back changes nothing:

```tsx
const [data, setData] = useState(record);
<Form schema={schema} validator={validator} formData={data} onChange={(event) => setData(event.formData)} />;
```

Any other value passed after mount is ignored, with a warning in development only: a production build shows the seed, or the stale record, with nothing logged. That covers v6 code such as `formData={record ?? {}}` with `record` from a fetch, or a parent that resets by setting its state to a blank object. To show other data, a record that loads after mount or the next record, remount the form under a `key`, which also clears its errors and gives the record the values the form fills in on mount only, such as a [`ui:initialValue`](./uiSchema.md#initialvalue):

```tsx
<Form key={record.id} schema={schema} validator={validator} initialFormData={record} onChange={save} />
```

To change the data in place, keeping the errors and the fields' own state, call [`setFieldValue('', data)`](../advanced-customization/internals.md#change-form-data-programmatically) on the form's ref, which reports the new value through `onChange` like any edit.

Only `undefined` means "not passed". `null` seeds the schema's defaults the way `undefined` does. `false`, `0` and `''` are values.

## globalUiOptionsKeys

The keys of the extensions to [`ui:globalOptions`](uiSchema.md#uiglobaloptions) that your own widgets, fields and templates read, beyond the ones RJSF reads there.
They are added to the ones the theme declares, and the registry's `globalUiOptions` hold only those and RJSF's own, so every field hands them to its widget in its `options`, beneath the field's own, and a template reads them with `getUiOptions(uiSchema, registry.globalUiOptions)`.
A key that is an option name RJSF reads per field, such as `widget` or `placeholder`, is not read from `ui:globalOptions`, and a warning says so.

```tsx
import { Form } from '@rjsf/core';
import { GlobalUISchemaOptions, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const globalOptions: GlobalUISchemaOptions<{ density?: 'compact' | 'comfortable' }> = { density: 'compact' };
const uiSchema: UiSchema = { 'ui:globalOptions': globalOptions };

// Each widget's `options.density` is 'compact', unless its own uiSchema sets another
render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} globalUiOptionsKeys={['density']} />,
  document.getElementById('app'),
);
```

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

## initialFormData

The seed of the form's data, the way `defaultValue` works on an `<input>`. It is read, and filled in with the schema's defaults, when the form mounts and when `reset()` is called, and ignored otherwise, so a value written inline does not replace the data the form holds on a re-render. Every edit is reported through [`onChange`](#onchange); read the current value with [`getFormData()`](../advanced-customization/internals.md#read-form-data-programmatically). When both props are passed, [`formData`](#formdata), a deprecated name for this prop, is the seed and `initialFormData` is ignored. To show other data after mount, remount the form under a `key`, or call `setFieldValue('', data)` on its ref.

The form's data shares its unchanged parts with the object you pass, so don't mutate that object afterwards; change a copy. In development the form freezes it from its first edit, validation, submit or reset on, so a mutation throws.

## nameGenerator

The `nameGenerator` prop allows you to customize how HTML `name` attributes are generated for form fields. This is essential when submitting form data to backend frameworks that expect specific naming conventions for structured data.

**Default behavior:** When no `nameGenerator` is provided, the `name` attribute will equal the `id` attribute (e.g., `root_tasks_0_title`).

RJSF provides two built-in generators:

**`bracketNameGenerator`** - Generates bracket notation for PHP/Rails (e.g., `root[tasks][0][title]`). Automatically appends `[]` for multi-value fields like checkboxes.

**`dotNotationNameGenerator`** - Generates dot notation for other frameworks (e.g., `root.tasks.0.title`).

```tsx
import { Form } from '@rjsf/core';
import { bracketNameGenerator, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
      },
    },
  },
};

render(
  <Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />,
  document.getElementById('app'),
);
```

You can also create a custom generator by implementing the `NameGeneratorFunction` type, which receives `path` (array of path segments), `idPrefix` (typically `'root'`), and optional `isMultiValue` (boolean for multi-value fields).

## liveOmit

Use this prop with `omitExtraData={true}` to remove extra data while editing, rather than waiting for submission.

Choose when to omit extra data:

- Omit this prop to disable live omission.
- Use `liveOmit="onChange"` to omit extra data after each edit.
- Use `liveOmit="onBlur"` to omit extra data when an edited field loses focus.

## liveValidate

Use this prop to show validation errors while editing, rather than waiting for submission.

Choose when to validate while editing:

- Omit this prop to validate on submission only.
- Use `liveValidate="onChange"` to validate after each edit.
- Use `liveValidate="onBlur"` to validate when an edited field loses focus.

## method

The value of this prop will be passed to the `method` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-method).

## name

The value of this prop will be passed to the `name` [HTML attribute on the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-name).

## noHtml5Validate

If set to true, turns off HTML5 validation on the form. Set to `false` by default.

## noValidate

If set to true, turns off all validation. Set to `false` by default.

> NOTE: In a future major release, this flag may be deleted replaced by making `validator` prop optional

## omitExtraData

If set to true, then extra form data values that are not in any form field will be removed whenever `onSubmit` is called. Set to `false` by default.

## onBlur

Sometimes you may want to trigger events or modify external state when a field has been touched, so you can pass an `onBlur` handler, which will receive the id of the input that was blurred and the field value.

## onChange

Called with the same first argument as `onSubmit` for every edit: user input, `setFieldValue()`, `reset()`, and blur validation or omission. It is not called for what the form derives on mount or when a prop changes, such as the schema's defaults: read those with `getFormData()`. The edit has been applied by the time it is called, so not storing it does not undo it; refuse or rewrite edits in [`transformChange`](#transformchange).
It will also receive, as the second argument, the `id` of the field which experienced the change.
Generally, this will be the `id` of the field for which input data is modified.
In the case of adding/removing of new fields in arrays or objects with `additionalProperties` or `patternProperties` and the rearranging of items in arrays, the `id` will be that of the array or object itself, rather than the item/field being added, removed or moved.

`onChange` runs as the edit is processed. React may update the inputs afterward, so read `event.formData` rather than reading values from the DOM inside the callback.

Each event carries the complete value, earlier edits of the same event included. A `setFieldValue()` call from inside `onChange` builds on the edit being handled. See the [migration examples](../migration-guides/v7.x%20upgrade%20guide.md#form-owns-its-data-breaking-change).

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

## presentation

A `ThemePresentation` declaring which parts of a field (its label, description, errors and help) the fields and widgets you register draw themselves, under the keys you register them by, plus a `default` for every part its own entry for a widget leaves out, which overrides the theme's and `@rjsf/core`'s declarations of those parts, and a `fieldDefault` for every part a field's merged entry leaves out.
It is layered part by part over the theme's declarations, which are layered over `@rjsf/core`'s, and the merged result is `registry.presentation`.
See [Custom Themes](../advanced-customization/custom-themes.md#presentation) for more information.

```tsx
import { Form } from '@rjsf/core';
import { ThemePresentation } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

// MyLabelledWidget draws its own label, so the FieldTemplate draws none for it
const presentation: ThemePresentation = { widgets: { MyLabelledWidget: { label: 'self' } } };

render(
  <Form schema={schema} validator={validator} widgets={{ MyLabelledWidget }} presentation={presentation} />,
  document.getElementById('app'),
);
```

## schema

**Required**! Form schema. We support JSON schema draft-07 by default. See [Schema Reference](https://json-schema.org/draft-07/json-schema-release-notes.html) for more information.

The schema is treated as immutable: it is parsed once per object, so a change made to it in place is not seen. Pass a new object to change it.

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

Pass a stable reference: a function recreated on every render of the parent counts as a changed prop, which re-derives the form's state and, with `liveValidate: 'onChange'`, re-validates the current data on every parent render. Wrap it in `useCallback` or define it outside the render function.

Keep it pure. The form calls it while React renders whenever the errors on screen have to follow the props, for example when a new `schema` is validated live, so it follows [React's rules for rendering](https://react.dev/reference/rules/components-and-hooks-must-be-pure): no side effects, the same result for the same arguments, and no reliance on being called once, since React can render more than once (Strict Mode does in development) or discard a render.

## transformChange

A pure function that decides what an edit leaves the form with. The form calls it with the data the edit produced and the data before it, for a field's change and for `setFieldValue()`, before it stores the result, validates it and reports it through [`onChange`](#onchange). Return `next` to take the edit, `previous` to refuse it, or another value, such as `next` with a field upper-cased:

```tsx
<Form
  schema={schema}
  validator={validator}
  transformChange={(next, previous) => {
    if ((next?.title ?? '').length > 80) {
      return previous;
    }
    return next?.code === undefined ? next : { ...next, code: next.code.toUpperCase() };
  }}
/>
```

It runs for every keystroke, so a rewrite has to hold for a value the user is still typing, and for a field they cleared, which is `undefined`. Upper-casing does; trimming would remove a space as soon as it is typed, so `hello world` would come out as `helloworld`. Trim on submit instead. Leave out a key `next` doesn't hold, as the example does for an empty `code`: `{ ...next, code: undefined }` adds one, so every edit while `code` is empty would come back rewritten.

Return a value on every path: `undefined` leaves the form with no data, which a function body that forgets a `return` does, so the form warns about it in development. What you return is filled in with the schema's defaults like any data the form holds, so a property with a `default` that you leave out, or set to `undefined` under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`, gets its default back. It is sanitized as the edit would be, too: when it switches an `if`/`then`/`else`, `dependencies` or other conditional, the values of the branch it leaves are dropped, as they are when the user makes that switch in the field. Return `next`'s unchanged subtrees as they are, so their fields do not render again. A copy of `previous` refuses the edit as `previous` itself does, except for an edit that leaves the data as it was, such as an option switch whose data fits both options or a reorder of two equal items: `next` is a copy of `previous` then, so a copy of either takes the edit, and only `previous` itself refuses it. At a root that holds a string, number or boolean, there is no copy to tell apart: such an edit's `next` is `previous` itself, so it can't be refused. The function must be pure: the form may call it again for the same edit. Don't mutate `next` or `previous`, since both share their unchanged parts with the data the form holds; return a new object instead. In development both are frozen, so a mutation throws. It is not called for what the form derives on its own: the defaults for a new schema, the live omit a blur runs, or a `reset()`.

## translateString

Optional string translation function, if provided, allows users to change the translation of the RJSF internal strings.
Some strings contain replaceable parameter values as indicated by `%1`, `%2`, etc.
The number after the `%` indicates the order of the parameter.
The ordering of parameters is important because some languages may choose to put the second parameter before the first in its translation. In addition to replaceable parameters, some of the strings support the use of markdown and simple html.

One can use the [documentation](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/enums.ts) of the `TranslatableString` values to determine which contain replaceable parameters and which support markdown and simple html.

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

## useFallbackUiForUnsupportedType

If set to true, when an unsupported schema type is encountered, the form will render a fallback UI instead of displaying an error.
The fallback UI will display a widget that allows the user to select a JSON Schema type, and a field containing the form data that matches the selected type.
It is also what renders a schema that allows [multiple types](../json-schema/single.md#multiple-types), offering exactly those types, and a property the schema puts no constraint on, such as an `additionalProperties: true` entry, offering every type.
Set to false by default.

## validator

**Required**! An implementation of the `ValidatorType` interface that is needed for form validation to work.
`@rjsf/validator-ajv8` exports the implementation of this interface from RJSF version 4.

## widgets

Dictionary of registered widgets in the form. See [Custom Widgets and Fields](../advanced-customization/custom-widgets-fields.md) for more information.
