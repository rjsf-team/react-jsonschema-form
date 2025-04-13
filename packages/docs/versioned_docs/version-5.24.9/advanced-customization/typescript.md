# Typescript Support

RJSF fully supports Typescript.
The [types and functions](../api-reference/utility-functions.md) exported by `@rjsf/utils` are fully typed (as needed) using one or more of the following 3 optional generics:

- `T = any`: This represents the type of the `formData` and defaults to `any`.
- `S extends StrictRJSFSchema = RJSFSchema`: This represents the type of the `schema` and extends the `StrictRJSFSchema` type and defaults to the `RJSFSchema` type.
- `F extends FormContextType = any`: This represents the type of the `formContext`, extends the `FormContextType` type and defaults to `any`.

Every other library in the `@rjsf/*` ecosystem use these same generics in their functions and React component definitions.
For instance, in the `@rjsf/core` library the definitions of the `Form` component and the `withTheme()` and `getDefaultRegistry()` functions are as follows:

```ts
export default class Form<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> extends Component<FormProps<T, S, F>, FormState<T, S, F>> {
  // ... class implementation
}

export default function withTheme<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  themeProps: ThemeProps<T, S, F>
) {
  // ... function implementation
}

export default function getDefaultRegistry<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Omit<Registry<T, S, F>, 'schemaUtils'> {
  // ... function implementation
}
```

Out of the box, the defaults for these generics will work for all use-cases.
Providing custom types for any of these generics may be useful for situations where the caller is working with typed `formData`, `schema` or `formContext` props, Typescript is complaining and type casting isn't allowed.

## Overriding generics

### T

The generic `T` is used to represent the type of the `formData` property passed into `Form`.
If you are working with a simple, unchanging JSON Schema and you have defined a type for the `formData` you are working with, you can override this generic as follows:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { Form } from '@rjsf/core';

interface FormData {
  foo?: string;
  bar?: number;
}

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
    bar: { type: 'number' },
  },
};

const formData: FormData = {};

const validator = customizeValidator<FormData>();

render(<Form<FormData> schema={schema} validator={validator} formData={formData} />, document.getElementById('app'));
```

### S

The generic `S` is used to represent the type of the `schema` property passed into `Form`.
If you are using something like the [Ajv utility types for schemas](https://ajv.js.org/guide/typescript.html#utility-types-for-schemas) typing system, you can override this generic as follows:

```tsx
import { JSONSchemaType } from 'ajv';
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { Form } from '@rjsf/core';

interface FormData {
  foo?: string;
  bar?: number;
}

type MySchema = JSONSchemaType<FormData>;

const schema: MySchema = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
    bar: { type: 'number' },
  },
};

const validator = customizeValidator<any, MySchema>();

render(<Form<any, MySchema> schema={schema} validator={validator} />, document.getElementById('app'));

// Alternatively since you have the type, you could also use this
// const validator = customizeValidator<FormData, MySchema>();
// render((
//  <Form<FormData, MySchema> schema={schema} validator={validator} />
//), document.getElementById("app"));
```

> NOTE: using this `Ajv typing system` has not been tested extensively with RJSF, so use carefully

### F

The generic `F` is used to represent the type of the `formContext` property passed into `Form`.
If you have a type for this data, you can override this generic as follows:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { Form } from '@rjsf/core';

interface FormContext {
  myCustomWidgetData: object;
}

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
    bar: { type: 'number' },
  },
};

const formContext: FormContext = {
  myCustomWidgetData: {
    enableCustomFeature: true,
  },
};

const validator = customizeValidator<any, RJSFSchema, FormContext>();

render(
  <Form<any, RJSFSchema, FormContext> schema={schema} validator={validator} formContext={formContext} />,
  document.getElementById('app')
);
```

## Overriding generics in core

As shown in previous examples, overriding the default `Form` from `@rjsf/core` is pretty straight forward.
Using the `withTheme()` function is just as easy:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { withTheme, ThemeProps } from '@rjsf/core';

interface FormData {
  foo?: string;
  bar?: number;
}

type MySchema = JSONSchemaType<FormData>;

const schema: MySchema = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
    bar: { type: 'number' },
  },
};

interface FormContext {
  myCustomWidgetData: object;
}

const theme: ThemeProps<FormData, MySchema, FormContext> = {
  widgets: { test: () => <div>test</div> },
};

const ThemedForm = withTheme<FormData, MySchema, FormContext>(theme);

const validator = customizeValidator<FormData, MySchema, FormContext>();

const Demo = () => <ThemedForm schema={schema} uiSchema={uiSchema} validator={validator} />;
```

## Overriding generics in other themes

Since all the other themes in RJSF are extensions of `@rjsf/core`, overriding parts of these themes with custom generics is a little different.
The exported `Theme` and `Form` from any of the themes have been created using the generic defaults, and as a result, do not take generics themselves.
In order to override generics, special `generateForm()` and `generateTheme()` functions are exported for your use.

### Overriding a Theme

If you are doing something like the following to create a new theme based on `@rjsf/mui` to extend one or more `templates`:

```tsx
import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { ThemeProps, withTheme } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { Theme } from '@rjsf/mui';

const OldBaseInputTemplate = Theme.templates.BaseInputTemplate;

// Force the underlying `TextField` component to always use size="small"
function MyBaseInputTemplate(props: WidgetProps) {
  return <OldBaseInputTemplate {...props} size='small' />;
}

const myTheme: ThemeProps = {
  ...Theme,
  templates: {
    ...Theme.templates,
    BaseInputTemplate: MyBaseInputTemplate,
  },
};

const ThemedForm = withTheme(myTheme);

const Demo = () => <ThemedForm schema={schema} uiSchema={uiSchema} validator={validator} />;
```

Then you would use the new `generateTheme()` and `generateForm()` functions as follows:

```tsx
import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { ThemeProps, withTheme } from '@rjsf/core';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { generateTheme } from '@rjsf/mui';

interface FormData {
  foo?: string;
  bar?: number;
}

type MySchema = JSONSchemaType<FormData>;

const schema: MySchema = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
    bar: { type: 'number' },
  },
};

interface FormContext {
  myCustomWidgetData: object;
}

const Theme: ThemeProps<FormData, MySchema, FormContext> = generateTheme<FormData, MySchema, FormContext>();

const OldBaseInputTemplate = Theme.templates.BaseInputTemplate;

// Force the underlying `TextField` component to always use size="small"
function MyBaseInputTemplate(props: WidgetProps<FormData, MySchema, FormContext>) {
  return <OldBaseInputTemplate {...props} size='small' />;
}

const myTheme: ThemeProps<FormData, MySchema, FormContext> = {
  ...Theme,
  templates: {
    ...Theme.templates,
    BaseInputTemplate: MyBaseInputTemplate,
  },
};

const ThemedForm = withTheme<FormData, MySchema, FormContext>(myTheme);

const validator = customizeValidator<FormData, MySchema, FormContext>();

// You could also do since they are effectively the same:
// const ThemedForm = generateForm<FormData, MySchema, FormContext>(myTheme);

const Demo = () => <ThemedForm schema={schema} uiSchema={uiSchema} validator={validator} />;
```

> NOTE: The same approach works for extending `widgets` and `fields` as well.
