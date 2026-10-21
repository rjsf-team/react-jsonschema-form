# Chakra-UI Customization

When using `@rjsf/chakra-ui` there are a couple of ways to customize the feel of the form.

## Styling

You can use `ChakraProvider`, where you can customize the field components at a theme level.
And, `uiSchema` allows for the use of a `"chakra"` `"ui:option"` to customize the styling of the form widgets.

```json
{
  "yourField": {
    "ui:options": {
      "chakra": {
        "p": "1rem",
        "color": "blue.200",
        "css": {
          "margin": "0 auto"
        }
      }
    }
  }
}
```

It accepts Chakra's [style props](https://chakra-ui.com/docs/styling/overview#style-props), and anything else in it is ignored. Only the style props of Chakra's default system are recognized: a utility or condition that your own `createSystem()` adds is ignored too.
Like any other option, it can also be written as the `"ui:chakra"` shorthand. It can be set for every field of the form under the root's `"ui:globalOptions"` too, which the theme's `UiSchema` type and `ChakraGlobalUISchemaOptions` type with it.

### Limitations

- The `chakra` option is only available for the Chakra-UI theme.
- The props are given to the parent component in the individual widget. To style the inner components, use a nested selector in the `css` prop, such as `"css": { "& input": { "bg": "gray.100" } }`, or a [slot recipe](https://chakra-ui.com/docs/theming/slot-recipes) in the theme.
