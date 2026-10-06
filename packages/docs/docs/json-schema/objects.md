# Objects

## Object properties

Objects are defined with a type equal to `object` and properties specified in the `properties` keyword.

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  title: 'My title',
  description: 'My description',
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

## Required properties

You can specify which properties are required using the `required` attribute:

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  title: 'My title',
  description: 'My description',
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
  required: ['name'],
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

## Specifying property order

Since the order of object properties in Javascript and JSON is not guaranteed, the `uiSchema` object spec allows you to define the order in which properties are rendered using the `ui:order` property:

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
    bar: { type: 'string' },
  },
};

const uiSchema: UiSchema = {
  'ui:order': ['bar', 'foo'],
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

If a guaranteed fixed order is only important for some fields, you can insert a wildcard `"*"` item in your `ui:order` definition. All fields that are not referenced explicitly anywhere in the list will be rendered at that point:

```ts
import { UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:order': ['bar', '*'],
};
```

## Additional and pattern properties

The `additionalProperties` keyword allows the user to add properties with arbitrary key names. Set this keyword equal to a schema object:

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
  },
  additionalProperties: {
    type: 'number',
    enum: [1, 2, 3],
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

In this way, an add button for new properties is shown by default.

You can also define `uiSchema` options for `additionalProperties` by setting the `additionalProperties` attribute in the `uiSchema`.

The `patternProperties` keyword allows the user to add properties with names that match one or more of the specified regular expressions

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
  },
  patternProperties: {
    '^foo+$': {
      type: 'number',
      enum: [1, 2, 3],
    },
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

Also in this case, an add button for new properties is shown by default.
A property added under a name one of the patterns matches is seeded from that pattern, so its field starts out holding the pattern's `const` or `default`, falling back to the starting value its type calls for — `{}`, `[]`, `0`, `false`, `null`, or the `New Value` string.
A pattern that constrains the value without naming a `type`, such as one that is only an `enum`, a `format` or a length, leaves the key to take its type from the value it holds, the way `additionalProperties` does, so the property renders as a field for that value with the pattern's constraint kept.

A key that matches none of the patterns is a property the object allows all the same, unless `additionalProperties: false` forbids it, since a schema that says nothing about its additional properties accepts any of them.
Such a key renders as a field for whatever value it holds, the way a key does under `additionalProperties: true`, so renaming a key to a name the patterns don't match leaves its value visible and editable.
Where `additionalProperties: false` does forbid it, the key has no subschema to render with and the property renders as the empty field a validation error accompanies.
An `unevaluatedProperties: false` forbids the same keys where the object names no `additionalProperties` to evaluate them, so it renders them the same way; beside any `additionalProperties`, `true` and a schema alike, it has nothing left to reject and no say in how the key renders.
Where the object names no `additionalProperties` at all, a form that sets `omitExtraData` drops a pattern-unmatched key all the same: that option keeps only the data a schema describes, and patterns describe no key they don't match, so the property is pruned on submit — or on the next change with `liveOmit` — however editable its field was.
An `additionalProperties` that is spelled out, `true` included, describes those keys, so `omitExtraData` keeps them.

### Constraining key names with `propertyNames`

The `propertyNames` keyword constrains the names a key may take.
When it enumerates those names, the key is rendered as a dropdown of the allowed names instead of a free-text input, so the user can only pick a name the schema accepts.

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  additionalProperties: {
    type: 'boolean',
  },
  propertyNames: {
    enum: ['darkMode', 'betaBanner', 'offlineCache'],
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

A name another key already holds is left out of the dropdown, since two properties cannot share a name, and the add button creates the new property under the first allowed name that is still free.
The exception is an object whose `patternProperties` have no `additionalProperties` schema beside them, where the add button prefers the first free name one of the patterns matches, since a name they don't match is one nothing in the schema describes — or, under `additionalProperties: false`, one it forbids.
Once every allowed name is taken the add button is hidden, the way it is at the `maxProperties` limit, since any further property could only be added under a name the schema rejects.
The `propertyNames` schema may be a `$ref` or an `allOf`; it is resolved before its `enum` is read.
Any other `propertyNames` schema, such as one constraining names by `pattern` or `maxLength`, leaves the free-text key input in place and is enforced by validation alone.

### `expandable` option

You can turn support for `additionalProperties` and `patternProperties` off with the `expandable` option in `uiSchema`:

```ts
import { UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:options': {
    expandable: false,
  },
};
```
