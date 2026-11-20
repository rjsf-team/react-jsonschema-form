# Semantic-UI Customization

There are various options to pass to semantic theme fields.

Note that every semantic property within uiSchema can be rendered in one of two ways: `{"ui:options": {semantic:{[property]: [value]}}}`

In other words, the following uiSchema is equivalent:

> Note: All fields have the following settings below as their default

```
fluid: Take on the size of its container.
inverted: Format to appear on dark backgrounds.
```

```json
{
  "ui:options": {
    "semantic": {
      "fluid": true,
      "inverted": false,
      "errorOptions": {
        "size": "small",
        "pointing": "above"
      }
    }
  }
}
```

#### Semantic Widget Optional Properties

- [Semantic props for TextWidget](https://react.semantic-ui.com/elements/input/)
- [Semantic props for CheckboxWidget](https://react.semantic-ui.com/modules/checkbox/)
- [Semantic props for SelectWidget](https://react.semantic-ui.com/modules/dropdown/)
- [Semantic props for RangeWidget](https://react.semantic-ui.com/elements/input/)
- [Semantic props for RadioWidget](https://react.semantic-ui.com/addons/radio/)
- [Semantic props for PasswordWidget](https://react.semantic-ui.com/elements/input/)
- [Semantic props for UpDownWidget](https://react.semantic-ui.com/elements/input/)
- [Semantic props for TextAreaWidget](https://react.semantic-ui.com/addons/text-area/)

## errorOptions

The uiSchema semantic object accepts an `errorOptions` property for each field of the schema:

```
size: determines the size of the error message dialog
pointing: determines the direction of the arrow on the error message dialog
```

Below are the current defaults

```tsx
import { UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:options': {
    semantic: {
      errorOptions: {
        size: 'small',
        pointing: 'above',
      },
    },
  },
};
```

## semantic options uiSchema for array items

To specify a uiSchema that applies to array items, specify the semantic uiSchema value within the `ui:options` property:

```
wrapItem: wrap each array item in a Segment
horizontalButtons: vertical buttons instead of the default horizontal
```

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
    semantic: {
      wrapItem: true,
      horizontalButtons: false,
    },
  },
};

render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, document.getElementById('app'));
```

## formContext

The formContext semantic object accepts `wrapContent` ,`wrapLabel` properties.

```
wrapContent: wrap all inputs  field content in a div, for custom styling
wrapLabel: wrap all labels in a div, for custom styling via CSS
```

```tsx
<Form
  formContext={{
    semantic: {
      wrapLabel: true,
      wrapContent: true,
    },
    // other props...
  }}
/>
```
