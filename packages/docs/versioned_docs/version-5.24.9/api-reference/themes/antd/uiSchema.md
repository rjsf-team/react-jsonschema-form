# AntD Customization

## formContext

You can customize the look of the form by passing options to Ant-Design theme fields.

The formContext antd object accepts `descriptionLocation`, `readonlyAsDisabled` properties.

`descriptionLocation` can be `'below' | 'tooltip'`, the default is `'below'` which places the description below the form item.
You can set it to `tooltip` that put the description inside the tooltip.
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

These are the `formContext` properties that you can modify to adjust the `antd` presentation:

- `descriptionLocation`: Where to display the description, either 'below' or 'tooltip', defaults to 'below'
- `readonlyAsDisabled`: Whether to make the antd theme treat readOnly fields as disabled, defaults to true

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
