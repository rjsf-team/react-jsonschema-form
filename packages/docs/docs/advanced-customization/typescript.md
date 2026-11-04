# Typescript Support

RJSF fully supports Typescript.
The [types and functions](../api-reference/utility-functions.md) exported by `@rjsf/utils` are fully typed (as needed) using one or more of the following 3 optional generics:

- `T = unknown`: This represents the type of the `formData` and defaults to `unknown`.
- `S extends StrictRJSFSchema = RJSFSchema`: This represents the type of the `schema` and extends the `StrictRJSFSchema` type and defaults to the `RJSFSchema` type.
- `F extends FormContextType = FormContextType`: This represents the type of the `formContext`, extends the `FormContextType` type and defaults to `FormContextType`.

Every other library in the `@rjsf/*` ecosystem use these same generics in their functions and React component definitions.
For instance, in the `@rjsf/core` library the definitions of the `Form` component and the `withTheme()` and `generateTheme()` functions are as follows:

```ts
export default function Form<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FormProps<T, S, F>) {
  // ... function implementation
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
>(): Pick<Registry<T, S, F>, 'fields' | 'widgets' | 'templates' | 'classMap'> & { presentation: ThemePresentation } {
  // ... function implementation
}
```

The defaults describe the general case, where RJSF cannot know the shape of your data: the schema decides it at runtime.
Because `T` defaults to `unknown` rather than `any`, code that reads `formData` without naming its type has to narrow it first.
Providing custom types for these generics is the way to avoid that, and is useful whenever the caller is working with typed `formData`, `schema` or `formContext` props.
`Form` infers `T` from the `initialFormData` prop (or its deprecated alias `formData`) when one is passed, so naming it is only needed when there is no seed to infer from.
The validator has no `T`: `ValidatorType<S, F>` puts the form data type on `validateFormData<T>()`, so one validator serves every form.

## Overriding generics

### T

The generic `T` is used to represent the type of the `formData` property passed into `Form`.
If you are working with a simple, unchanging JSON Schema and you have defined a type for the `formData` you are working with, you can override this generic as follows:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';

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

render(<Form<FormData> schema={schema} validator={validator} initialFormData={formData} />, document.getElementById('app'));
```

### S

The generic `S` is used to represent the type of the `schema` property passed into `Form`.
It has to extend `StrictRJSFSchema`, the `JSONSchema7` of `@types/json-schema`, and defaults to `RJSFSchema`, which is the same type.
A type of your own that extends it can declare a keyword on the root schema, and you can override this generic with it as follows:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';

interface FormData {
  foo?: string;
  bar?: number;
}

type MySchema = RJSFSchema & { 'x-version'?: number };

const schema: MySchema = {
  type: 'object',
  'x-version': 2,
  properties: {
    foo: { type: 'string' },
    bar: { type: 'number' },
  },
};

const validator = customizeValidator<MySchema>();

render(<Form<FormData, MySchema> schema={schema} validator={validator} />, document.getElementById('app'));
```

A subschema is still a `JSONSchema7Definition`, so a keyword declared this way type-checks on the root alone; to declare one at every depth, see [Keywords of your own](#keywords-of-your-own).

The [Ajv utility types for schemas](https://ajv.js.org/guide/typescript.html#utility-types-for-schemas) don't fit `S`: `JSONSchemaType<FormData>` holds `readonly` arrays, such as its `anyOf`, where `JSONSchema7` takes mutable ones, so `Form<FormData, JSONSchemaType<FormData>>` fails with TS2344.
Type the schema as `RJSFSchema` and the data with `T` instead.

#### Keywords of your own

`RJSFSchema` is the `JSONSchema7` of `@types/json-schema`, which `@rjsf/utils` augments with the later-draft, OpenAPI and Ajv keywords RJSF or its validators read.
Declare a keyword RJSF doesn't read the same way, so that it type-checks at every depth of a schema:

```ts
import type { RJSFSchema } from '@rjsf/utils';

declare module 'json-schema' {
  interface JSONSchema7 {
    'x-group'?: string;
  }
}

const schema: RJSFSchema = { type: 'object', properties: { phone: { type: 'string', 'x-group': 'contact' } } };
```

The module has to resolve from your own code, to the copy `@rjsf/utils` uses.
A package manager that doesn't hoist `@types/json-schema`, as pnpm doesn't by default, reports TS2664 (`Invalid module name in augmentation`) until your project lists it among its own dependencies. List a version `@rjsf/utils` accepts (`^7.0.15`), so that both resolve to one copy: the augmentation doesn't reach a second copy nested under `@rjsf/utils`.

The file also has to be a module, with an `import` or an `export`, as the example is.
In a file with neither, such as a `.d.ts` of its own, `declare module` replaces `json-schema` instead of adding to it, and TypeScript reports TS2353 on `type` and every other keyword until you add `export {};`.

An augmentation adds keywords but can't change the type of one `JSONSchema7` already declares (TS2717).
So Ajv's `$data` reference, which `formatMinimum` and its siblings take, doesn't type-check in `minimum`, `maximum`, `multipleOf` or another keyword typed as a number, even though a validator built with `customizeValidator({ ajvOptionsOverrides: { $data: true } })` validates it.
The built-in widgets pass over a `$data` reference in `minimum`, `maximum` and `multipleOf` only; one in another keyword, such as `maxItems`, isn't handled yet, so an array with `maxItems: { $data: '1/limit' }` shows no Add button.
Convert such a schema through `unknown`, since a direct `as RJSFSchema` fails with TS2352:

```ts
import type { RJSFSchema } from '@rjsf/utils';

const schema = {
  type: 'object',
  properties: { low: { type: 'number' }, high: { type: 'number', minimum: { $data: '1/low' } } },
} as unknown as RJSFSchema;
```

### F

The generic `F` is used to represent the type of the `formContext` property passed into `Form`.
If you have a type for this data, you can override this generic as follows:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';

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
import { withTheme, type ThemeProps } from '@rjsf/core';

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
import { SlotComponent, WidgetProps } from '@rjsf/utils';
import { type ThemeProps, withTheme } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { type MuiBaseInputTemplateProps, Templates, Theme } from '@rjsf/mui';

// `BaseInputTemplateProps` doesn't declare `TextField`'s `size`, which `MuiBaseInputTemplateProps` does
const OldBaseInputTemplate: SlotComponent<MuiBaseInputTemplateProps> = Templates.BaseInputTemplate;

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
import { SlotComponent, WidgetProps } from '@rjsf/utils';
import { type ThemeProps, withTheme } from '@rjsf/core';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { type MuiBaseInputTemplateProps, Templates, generateTheme } from '@rjsf/mui';

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

const OldBaseInputTemplate: SlotComponent<
  MuiBaseInputTemplateProps<FormData, MySchema, FormContext>
> = Templates.BaseInputTemplate;

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
