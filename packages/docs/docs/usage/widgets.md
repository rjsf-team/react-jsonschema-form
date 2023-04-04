# Widgets

The uiSchema `ui:widget` property tells the form which UI widget should be used to render a field.

Example:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    done: {
      type: 'boolean',
    },
  },
};

const uiSchema: UiSchema = {
  done: {
    'ui:widget': 'radio', // could also be "select"
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

Here's a list of supported alternative widgets for different JSON Schema data types:

## For `boolean` fields

- `radio`: a radio button group with `true` and `false` as selectable values;
- `select`: a select box with `true` and `false` as options;
- by default, a checkbox is used

> Note: To set the labels for a boolean field, instead of using `true` and `false`, your schema can use `oneOf` with `const` values for both true and false, where you can specify the custom label in the `title` field. You will also need to specify a widget in your `uiSchema`. See the following example:

schema:

```json
{
  "properties": {
    "booleanWithCustomLabels": {
      "type": "boolean",
      "oneOf": [
        { "const": true, "title": "Custom label for true" },
        { "const": false, "title": "Custom label for false" }
      ]
    }
  }
}
```

uiSchema:

```json
{
  "booleanWithCustomLabels": {
    "ui:widget": "radio" // or "select"
  }
}
```

## For `string` fields

- `textarea`: a `textarea` element is used;
- `password`: an `input[type=password]` element is used;
- `color`: an `input[type=color]` element is used;
- by default, a regular `input[type=text]` element is used.

### String formats

The built-in string field also supports the JSON Schema `format` property, and will render an appropriate widget by default for the following string formats:

- `email`: An `input[type=email]` element is used;
- `uri`: An `input[type=url]` element is used;
- `data-url`: By default, an `input[type=file]` element is used; in case the string is part of an array, multiple files will be handled automatically (see [File widgets](#file-widgets)).
- `date`: By default, an `input[type=date]` element is used;
- `date-time`: By default, an `input[type=datetime-local]` element is used.
- `time`: By default an `input[type=time]` element is used;

![](https://i.imgur.com/xqu6Lcp.png)

Please note that, even though they are standardized, `datetime-local`, `date` and `time` input elements are not supported by IE. If you plan on targeting IE, two alternative widgets are available:

- `alt-datetime`: Six `select` elements are used to select the year, the month, the day, the hour, the minute and the second;
- `alt-date`: Three `select` elements are used to select the year, month and the day.

![](https://i.imgur.com/VF5tY60.png)

You can customize the list of years displayed in the `year` dropdown by providing a `yearsRange` property to `ui:options` in your uiSchema. It's also possible to remove the `Now` and `Clear` buttons with the `hideNowButton` and `hideClearButton` options.

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
};

const uiSchema: UiSchema = {
  'ui:widget': 'alt-datetime',
  'ui:options': {
    yearsRange: [1980, 2030],
    hideNowButton: true,
    hideClearButton: true,
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

## For `number` and `integer` fields

- `updown`: an `input[type=number]` updown selector;
- `range`: an `input[type=range]` slider;
- `radio`: a radio button group with enum values. This can only be used when `enum` values are specified for this input.
- By default, a regular `input[type=number]` element is used.

> Note: If JSON Schema's `minimum`, `maximum` and `multipleOf` values are defined, the `min`, `max` and `step` input attributes values will take those values.

## Hidden widgets

It's possible to use a hidden widget for a field by setting its `ui:widget` uiSchema directive to `hidden`:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    foo: { type: 'boolean' },
  },
};

const uiSchema: UiSchema = {
  foo: { 'ui:widget': 'hidden' },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

Notes:

- Hiding widgets is only supported for `boolean`, `string`, `number` and `integer` schema types;
- A hidden widget takes its value from the `formData` prop.

## File widgets

This library supports a limited form of `input[type=file]` widgets, in the sense that it will propagate file contents to form data state as [data-url](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)s.

There are two ways to use file widgets.

1. By declaring a `string` json schema type along a `data-url` [format](#string-formats):

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'string',
  format: 'data-url',
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

2. By specifying a `ui:widget` field uiSchema directive as `file`:

```ts
import { RJSFSchema, UiSchema } from '@rjsf/utils';

const schema: RJSFSchema = {
  type: 'string',
};

const uiSchema: UiSchema = {
  'ui:widget': 'file',
};
```

### Multiple files

Multiple files selectors are supported by defining an array of strings having `data-url` as a format:

```ts
import { RJSFSchema } from '@rjsf/utils';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
    format: 'data-url',
  },
};
```

> Note that storing large dataURIs into form state might slow rendering.

### File widget input ref

The included `FileWidget` exposes a reference to the `<input type="file" />` element node as an `inputRef` component property.

This allows you to programmatically trigger the browser's file selector, which can be used in a custom file widget.

### `accept` option

You can use the accept attribute to specify a filter for what file types the user can upload:

```ts
import { RJSFSchema, UiSchema } from '@rjsf/utils';

const schema: RJSFSchema = {
  type: 'string',
  format: 'data-url',
};

const uiSchema: UiSchema = {
  'ui:options': { accept: '.pdf' },
};
```
