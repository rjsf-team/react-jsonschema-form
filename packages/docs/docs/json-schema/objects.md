# Objects

## Object properties

Objects are defined with a type equal to `object` and properties specified in the `properties` keyword.

```tsx
import Form from '@rjsf/core';
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
import Form from '@rjsf/core';
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
import Form from '@rjsf/core';
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
import Form from '@rjsf/core';
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
import Form from '@rjsf/core';
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
The add button has to pick that seed before the user has picked the name, so renaming a property that still holds its seed onto a name another subschema describes seeds it again from that one, and a value the user has entered is kept whatever the rename does to it.
A pattern that constrains the value without naming a `type`, such as one that is only a `format` or a length, leaves the key to take its type from the value it holds, the way `additionalProperties` does, so the property renders as a field for that value with the pattern's constraint kept.
A pattern that is only an `enum` takes the type its values have, so an `enum` of numbers renders as a numeric select rather than a textual one.
A pattern of `false` rejects every value a key could hold, so a key it matches renders the way a forbidden key does below.
Where several patterns match a key, they describe it together, and a `false` among them forbids it however permissive the others are.
A pattern is matched the way a validator compiles it, with the `u` flag, so a unicode property escape such as `\p{Lu}` matches the characters it names rather than that text, and the keys the form describes through a pattern are the keys validation accepts.

A key that matches none of the patterns is a property the object allows all the same, unless `additionalProperties: false` forbids it, since a schema that says nothing about its additional properties accepts any of them.
Such a key renders as a field for whatever value it holds, the way a key does under `additionalProperties: true`, so renaming a key to a name the patterns don't match leaves its value visible and editable.
A key the selected `anyOf`/`oneOf` option declares as a property of its own is that option's to render rather than an additional property, so it takes no second field beside the one the option renders for it.
An option declares a key through its own `properties`, through a `$ref` or an `allOf` it is composed of, or through the `then`/`else` branch its condition takes for the data in hand.
Every other key is an additional property of the object and the selected option together: the option's `additionalProperties`, `unevaluatedProperties` and `patternProperties` describe it beside the object's own, a key either forbids is forbidden, and a key the option allows without describing it renders as the object's keyword describes it.
Where the object or the option takes extra keys, switching to an option that does not declare a key the data holds therefore turns it into an additional property, with its key input and remove button.
Where `additionalProperties: false` does forbid it, the key has no subschema to render with and the property renders as the empty field a validation error accompanies.
An `unevaluatedProperties` answers for the same keys where the object names no `additionalProperties` to evaluate them: a `false` forbids them, so it renders them the same way, and a schema describes what they may hold, so they render as the field it calls for, exactly as an `additionalProperties` schema's keys do.
Beside any `additionalProperties`, `true` and a schema alike, it has nothing left to say and no say in how the key renders.
An object whose only such keyword is an `unevaluatedProperties` takes extra keys as much as one naming `additionalProperties` or `patternProperties` does, so the keys its form data holds render and its add button is shown.
The form reads the keyword whatever JSON Schema draft the validator is configured for, while the default `@rjsf/validator-ajv8` instance is a draft-07 AJV, which ignores it: a schema that relies on it should be validated by an AJV that reads it too, through the [`AjvClass`](../usage/validation.md#ajvclass) option, so that the names the form forbids are the ones validation rejects.
Where the object names neither `additionalProperties` nor `unevaluatedProperties`, a form that sets `omitExtraData` drops a pattern-unmatched key all the same, unless its [`additionalPropertiesWhenAbsent`](#objects-naming-no-additionalproperties) is `'allow'`: that option keeps only the data a schema describes, and patterns describe no key they don't match, so the property is pruned on submit — or on the next change with `liveOmit` — however editable its field was.
Either keyword spelled out, `true` included, describes those keys, so `omitExtraData` keeps them; it reads the two with the same precedence the rest of the form does, so a key an `unevaluatedProperties` describes is kept only where no `additionalProperties` evaluates it.

### Objects naming no `additionalProperties`

JSON Schema reads an object that names neither `additionalProperties` nor `unevaluatedProperties` as taking any key its `properties` and `patternProperties` leave over, as `additionalProperties: true` does.
By default the form does not follow it: an object naming none of `additionalProperties`, `unevaluatedProperties` and `patternProperties` gets no add button and renders none of the extra keys of its data, and `omitExtraData` drops every key no property or pattern names.
Set the `Form`'s [`additionalPropertiesWhenAbsent`](../api-reference/form-props.md#additionalpropertieswhenabsent) prop to `'allow'` to have the form read the schema as the spec does:

```tsx
import { Form } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
};

render(
  <Form schema={schema} validator={validator} additionalPropertiesWhenAbsent='allow' />,
  document.getElementById('app'),
);
```

The object then gets an add button, the extra keys of its data render with their key input and remove button, each as a field for the value it holds, and `omitExtraData` keeps them, exactly as under `additionalProperties: true`.
A schema that names a keyword is read as it stands either way, so an `additionalProperties: false` or an `unevaluatedProperties: false` still closes the object.
A schema that is no object, an untyped `{}` included, gets no add button.

An object `anyOf`/`oneOf` union, such as `{ type: 'object', oneOf: [...] }`, takes extra keys too, so under `'allow'` it renders its own field beside the option it shows, with its title and add button; the option shows only its own properties.
The union is read joined with the option it shows, so where that option names `additionalProperties: false` it takes no extra key and renders as it does under `'forbid'`.
To keep such a union closed, give it `additionalProperties: false`, or hide its add button with the [`expandable` option](#expandable-option).

### Constraining key names with `propertyNames`

The `propertyNames` keyword constrains the names a key may take.
When it enumerates those names, the key is rendered as a dropdown of the allowed names instead of a free-text input, so the user can only pick a name the schema accepts.

```tsx
import Form from '@rjsf/core';
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
The exception is an object whose `patternProperties` have no `additionalProperties` schema beside them, where the add button prefers the first free name the schema describes, since a name no pattern matches is one nothing in the schema describes — or, under `additionalProperties: false`, one it forbids — and a name matched only by a pattern of `false` is one it forbids too.
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
