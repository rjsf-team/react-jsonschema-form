# uiSchema Options for AntD

You can customize the look of the form by passing options to Ant-Design theme fields.

## formContext

The formContext antd object accepts `descriptionLocation` property. It can be `'below' | 'tooltip'`, the default is `'below'`. Note that you should have antd 4.7+ to use `'tooltip'`.

```
descriptionLocation: Where to display the description, either 'below' or 'tooltip'
```

```jsx
<Form
  formContext={{
    "antd": {
      "descriptionLocation": "tooltip"
    }
    // other props...
  }}
/>
```
