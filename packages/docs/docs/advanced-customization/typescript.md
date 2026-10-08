# Typescript Support

RJSF fully supports Typescript.
The [types and functions](../api-reference/utility-functions.md) exported by `@rjsf/utils` are fully typed (as needed) using one or more of the following 3 optional generics:

- `T = unknown`: This represents the type of the `formData` and defaults to `unknown`.
- `S extends StrictRJSFSchema = RJSFSchema`: This represents the type of the `schema` and extends the `StrictRJSFSchema` type and defaults to the `RJSFSchema` type.
- `F extends FormContextType = FormContextType`: This represents the type of the `formContext`, extends the `FormContextType` type and defaults to `FormContextType`.

Every other library in the `@rjsf/*` ecosystem use these same generics in their functions and React component definitions.
For instance, in the `@rjsf/core` library the definitions of the `Form` component and the `withTheme()` and `generateTheme()` functions are as follows:

```ts
export default class Form<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends Component<FormProps<T, S, F>, FormState<T, S, F>> {
  // ... class implementation
}

export default function withTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(themeProps: ThemeProps<T, S, F>): ThemedForm<T, S, F> {
  // ... function implementation
}

export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): Pick<Registry<T, S, F>, 'fields' | 'widgets' | 'templates'> {
  // ... function implementation
}
```

The defaults describe the general case, where RJSF cannot know the shape of your data: the schema decides it at runtime.
Because `T` defaults to `unknown` rather than `any`, code that reads `formData` without naming its type has to narrow it first.
Providing custom types for these generics is the way to avoid that, and is useful whenever the caller is working with typed `formData`, `schema` or `formContext` props.
`Form` infers `T` from the `formData` prop when one is passed, so naming it is only needed when there is no `formData` to infer from.
The validator has no `T`: `ValidatorType<S, F>` puts the form data type on `validateFormData<T>()`, so one validator serves every form.

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

const validator = customizeValidator();

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

const validator = customizeValidator<MySchema>();

render(<Form<any, MySchema> schema={schema} validator={validator} />, document.getElementById('app'));

// Alternatively since you have the type, you could also use this
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

const validator = customizeValidator<RJSFSchema, FormContext>();

render(
  <Form<any, RJSFSchema, FormContext> schema={schema} validator={validator} formContext={formContext} />,
  document.getElementById('app'),
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

const validator = customizeValidator<MySchema, FormContext>();

const Demo = () => <ThemedForm schema={schema} uiSchema={uiSchema} validator={validator} />;
```

## Overriding generics in other themes

Since all the other themes in RJSF are extensions of `@rjsf/core`, overriding parts of these themes with custom generics is a little different.
The exported `Form` from any of the themes is a `ThemedForm`, generic over the form data like `Form` itself, and the exported `Theme`, `Templates` and `Widgets` keep each component's own generics, so the `withTheme()` example above works unchanged with a theme's `Theme`.
To pin the generics up front instead, `generateForm()` and `generateTheme()` functions are exported for your use.

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
import { Templates, generateTheme } from '@rjsf/mui';

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

const OldBaseInputTemplate = Templates.BaseInputTemplate;

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

const validator = customizeValidator<MySchema, FormContext>();

// You could also do since they are effectively the same:
// const ThemedForm = generateForm<FormData, MySchema, FormContext>(myTheme);

const Demo = () => <ThemedForm schema={schema} uiSchema={uiSchema} validator={validator} />;
```

> NOTE: The same approach works for extending `widgets` and `fields` as well.
