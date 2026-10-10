# Arrays

Arrays are defined with a type equal to `array`, and array items' schemas are specified in the `items` keyword.

## Arrays of a single field

Arrays of a single field type can be specified as follows:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

## Arrays of objects

Arrays of objects can be specified as follows:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
    },
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

## uiSchema for array items

To specify a uiSchema that applies to array items, specify the uiSchema value within the `items` property:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

const uiSchema = {
  items: {
    'ui:widget': 'textarea',
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

> NOTE: The `items` property in `uiSchema` can also accept a function for dynamic UI schema generation based on array item data. See [Dynamic UI Schema Examples](../api-reference/dynamic-ui-schema-examples.md) for advanced use cases.

## The `additionalItems` keyword

The `additionalItems` keyword allows the user to add additional items of a given schema. For example:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
  additionalItems: {
    type: 'boolean',
  },
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

## Array item uiSchema options

Any of these options can be set globally if they are contained within the `ui:globalOptions` block.
They can also be overridden on a per-field basis inside a `ui:options` block as shown below.

### `orderable` option

Array items are orderable by default, and react-jsonschema-form renders move up/down buttons alongside them. The uiSchema `orderable` options allows you to disable ordering:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

const uiSchema: UiSchema = {
  'ui:options': {
    orderable: false,
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

### `addable` option

If either `items` or `additionalItems` contains a schema object, an add button for new items is shown by default. You can turn this off with the `addable` option in `uiSchema`:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

const uiSchema: UiSchema = {
  'ui:options': {
    addable: false,
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

### `copyable` option

A copy button is **NOT** shown by default for an item if `items` contains a schema object, or the item is an `additionalItems` instance.
You can turn this **ON** with the `copyable` option in `uiSchema`:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

const uiSchema: UiSchema = {
  'ui:options': {
    copyable: true,
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

### `removable` option

A remove button is shown by default for an item if `items` contains a schema object, or the item is an `additionalItems` instance. You can turn this off with the `removable` option in `uiSchema`:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

const uiSchema: UiSchema = {
  'ui:options': {
    removable: false,
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

### `itemLabel` option

An item's buttons are titled `Move up`, `Move down`, `Copy` and `Remove` by default, and screen readers announce those titles as the buttons' names, so every item in the list has buttons with the same names. Set `itemLabel` to the property of each item that names it, and the item's buttons are titled after it instead, such as `Remove report.pdf`:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  title: 'Attachments',
  items: {
    type: 'object',
    properties: {
      fileName: { type: 'string' },
    },
  },
};

const uiSchema: UiSchema = {
  'ui:options': {
    itemLabel: 'fileName',
  },
};

render(
  <Form
    schema={schema}
    uiSchema={uiSchema}
    initialFormData={[{ fileName: 'report.pdf' }, { fileName: 'invoice.pdf' }]}
    validator={validator}
  />,
  document.getElementById('app'),
);
```

A dotted path, such as `'file.name'`, reads a nested property, and `'.'` names each item by its own value, for an array of strings or numbers. Since `.`, `[` and `]` always separate the parts of the path, a property whose own key contains one of them can't name the items, and a path of only separators other than `'.'`, such as `'[]'`, names nothing. An item whose value there isn't a non-empty string or a number keeps the default titles, such as one added to an array whose items have no default for that property.

When more than one item has the same name, as when an item is copied, those items are numbered in the order they were added to the array, such as `Remove report.pdf (1)` and `Remove report.pdf (2)`, so their buttons can still be told apart. The items in the initial data are numbered in their order. A number stays with its item when items are moved or copied, and a copy takes the next number. The numbers stay consecutive, so removing one of those items renumbers the ones added after it. The numbers count only the items with that name, so adding, removing or moving an item with another name doesn't change them, and if a numbered name is already another item's name, the next free number is used. Items are named when their options give them buttons, so none are when `orderable` and `removable` are `false` and Copy can't show. Copy shows only while an item can be added, so it never does when `copyable` isn't set, when `addable` is `false`, or when `maxItems` leaves no room for another item. In an array with fixed `items`, the fixed items can't be moved or removed, so they're named only when they can show Copy, which also needs `additionalItems`.

The titles come from translatable strings: `CopyItemButton`, `MoveDownItemButton`, `MoveUpItemButton` and `RemoveItemButton`, in which `%1` is the item's name, and `ItemNameWithNumber`, in which `%1` is a shared name and `%2` its number. If you translate RJSF's strings with a custom [`translateString`](../api-reference/form-props.md#translatestring), translate these as well. A title it returns empty is left off, so that button keeps its default title, and if it returns `ItemNameWithNumber` empty, shared names aren't numbered.

## Multiple-choice list

The default behavior for array fields is a list of text inputs with add/remove buttons. There are two alternative widgets for picking multiple elements from a list of choices. Typically, this applies when a schema has an `enum` list for the `items` property of an `array` field, and the `uniqueItems` property set to `true`.

Example:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  title: 'A multiple-choice list',
  items: {
    type: 'string',
    enum: ['foo', 'bar', 'fuzz', 'qux'],
  },
  uniqueItems: true,
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

By default, this will render a multiple select box. If you prefer a list of checkboxes, just set the uiSchema `ui:widget` directive to `checkboxes` for that field:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  title: 'A multiple-choice list',
  items: {
    type: 'string',
    enum: ['foo', 'bar', 'fuzz', 'qux'],
  },
  uniqueItems: true,
};

const uiSchema: UiSchema = {
  'ui:widget': 'checkboxes',
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

## Custom widgets

In addition to [ArrayFieldTemplate](../advanced-customization/custom-templates.md#arrayfieldtemplate) you use your own widget by providing it to the uiSchema with the property of `ui:widget`.

Example:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const CustomSelectComponent = (props) => {
  return (
    <select>
      {props.value.map((item, index) => (
        <option key={index} id='custom-select'>
          {item}
        </option>
      ))}
    </select>
  );
};

const schema: RJSFSchema = {
  type: 'array',
  title: 'A multiple-choice list',
  items: {
    type: 'string',
  },
};

const uiSchema: UiSchema = {
  'ui:widget': 'CustomSelect',
};

const widgets = {
  CustomSelect: CustomSelectComponent,
};

render(
  <Form schema={schema} uiSchema={uiSchema} widgets={widgets} validator={validator} />,
  document.getElementById('app'),
);
```

## Specifying the minimum or maximum number of items

Note that when an array property is marked as `required`, an empty array is considered valid. If the array needs to be populated, you can specify the minimum number of items using the `minItems` property.

Example:

```tsx
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  minItems: 2,
  title: 'A multiple-choice list',
  items: {
    type: 'string',
    enum: ['foo', 'bar', 'fuzz', 'qux'],
  },
  uniqueItems: true,
};

render(<Form schema={schema} validator={validator} />, document.getElementById('app'));
```

You can also specify the maximum number of items in an array using the `maxItems` property.

## Inline checkboxes

By default, checkboxes are stacked. If you prefer them inline, set the `inline` property to `true`:

```tsx
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = {
  type: 'array',
  minItems: 2,
  title: 'A multiple-choice list',
  items: {
    type: 'string',
    enum: ['foo', 'bar', 'fuzz', 'qux'],
  },
  uniqueItems: true,
};

const uiSchema: UiSchema = {
  'ui:widget': 'checkboxes',
  'ui:options': {
    inline: true,
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```
