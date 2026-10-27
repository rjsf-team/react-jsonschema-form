# AntD Customization

## formContext

You can customize the look of the form by passing options to Ant-Design theme fields.

The formContext antd object accepts `descriptionLocation`, `readonlyAsDisabled` properties.

`descriptionLocation` can be `'below' | 'tooltip'`, the default is `'below'` which places the description below the form item.
You can set it to `tooltip` that put the description inside the tooltip.
antd draws a tooltip only beside a label, so a field whose template draws no label, such as a checkbox, still shows its description below.
Note that you should have antd 4.7+ to use `'tooltip'`.

Setting `{readonlyAsDisabled: false}` on the formContext will make the antd theme treat readOnly fields as disabled.

```tsx
<Form
  formContext={{
    descriptionLocation: 'tooltip',
    readonlyAsDisabled: false,
    // other props...
  }}
/>
```

These are the `formContext` properties that you can modify to adjust the `antd` presentation. `AntdFormContext`, exported from `@rjsf/antd`, types them, to pass as `Form`'s `F` type argument or to extend with your own:

- `colon`: Whether a label ends in a colon, defaults to true
- `colSpan`: The columns of antd's 24-column grid an object's property spans, for every property or as a record keyed by its widget or field name, defaults to 24
- `descriptionLocation`: Where to display the description, either 'below' or 'tooltip', defaults to 'below'
- `labelAlign`: The alignment of the labels of objects and arrays, either 'left' or 'right', defaults to 'right'
- `labelCol`: The antd `Col` props of a field's label
- `readonlyAsDisabled`: Whether to make the antd theme treat readOnly fields as disabled, defaults to true
- `rowGutter`: The gutter between the columns of a row, as antd's `Row` takes it, defaults to 24; an `AltDateWidget` spaces its date parts by half its horizontal gutter
- `toolbarAlign`: The vertical alignment of an array item's toolbar, as antd's `Row` takes it, defaults to 'middle' beside a label and 'top' otherwise
- `wrapperCol`: The antd `Col` props of a field's control
- `wrapperStyle`: The style of a field's control

```tsx
import Form, { type AntdFormContext } from '@rjsf/antd';

const formContext: AntdFormContext = { labelAlign: 'left', rowGutter: [8, 8] };

<Form<MyData, RJSFSchema, AntdFormContext> formContext={formContext} /* other props... */ />;
```

## Using Antd v5 theme

You can use AntD v5 styling by wrapping your application with `StyleProvider` from `@ant-design/cssinjs`.

By default, `@rjsf/antd` components are using the v4 styling.

```tsx
import { StyleProvider } from '@ant-design/cssinjs';

const Component = () => {
  return (
    <StyleProvider>
      <YourFormComponents />
    </StyleProvider>
  );
};
```
