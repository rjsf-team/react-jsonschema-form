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
        "sx": {
          "margin": "0 auto"
        }
      }
    }
  }
}
```

It accepts the theme accessible [style props](https://chakra-ui.com/docs/features/style-props) provided by [Chakra](https://chakra-ui.com/docs/getting-started) and [Emotion](https://emotion.sh/docs/introduction).

### Limitations

- The `chakra` option is only available for the Chakra-UI theme.
- The props are given to the parent component in the individual widget. To pass styles to the inner components, use the [`sx` prop](https://chakra-ui.com/docs/features/the-sx-prop).
