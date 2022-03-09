# AntD Customization

You can customize the look of the form by passing options to Ant-Design theme fields.

## formContext

The formContext antd object accepts `descriptionLocation`, `readonlyAsDisabled` properties.

`descriptionLocation` can be `'below' | 'tooltip'`, the default is `'below'` which places the description below the form item. You can set it to `tooltip` that put the description inside the tooltip. Note that you should have antd 4.7+ to use `'tooltip'`.

Setting `{readonlyAsDisabled: false}` on the formContext will make the antd theme treat readOnly fields as disabled.

```
descriptionLocation: Where to display the description, either 'below' or 'tooltip'
readonlyAsDisabled: Whether to make the antd theme treat readOnly fields as disabled
```

```jsx
<Form
  formContext={{
    "antd": {
      "descriptionLocation": "tooltip",
      "readonlyAsDisabled": false
    }
    // other props...
  }}
/>
```
