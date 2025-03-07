# PrimeReact Customization

You may set PrimeReact-specific options in the `uiSchema` object using the `"prime"` `"ui:option"`.

```json
{
  "password": {
    "ui:options": {
      "prime": {
        "feedback": true,
        "weakLabel": "Too weak",
        "mediumLabel": "Could be stronger",
        "strongLabel": "Strong password",
        "toggleMask": true
      }
    }
  }
}
```

## Components

The `@rjsf/primereact` theme renders to the following PrimeReact components:

- [`InputText`](https://primereact.org/inputtext/) as the default widget
- [`AutoComplete`](https://primereact.org/autocomplete/) as the default with `examples`
- [`Checkbox`](https://primereact.org/checkbox/) for boolean fields and `checkboxes` widget
- [`ColorPicker`](https://primereact.org/colorpicker/) as `color` widget
- [`Password`](https://primereact.org/password/) as `password` widget
- [`RadioButton`](https://primereact.org/radiobutton/) as `radio` widget
- [`Slider`](https://primereact.org/slider/) as `range` widget
- [`Dropdown`](https://primereact.org/dropdown/) as `select` widget
- [`MultiSelect`](https://primereact.org/multiselect/) as `select` widget with `multiple` option
- [`InputTextarea`](https://primereact.org/inputtextarea/) as `textarea` widget
- [`InputNumber`](https://primereact.org/inputnumber/) as `updown` widget

Please refer to the [PrimeReact documentation](https://primereact.org/) for the available PrimeReact-specific options
of each component.
