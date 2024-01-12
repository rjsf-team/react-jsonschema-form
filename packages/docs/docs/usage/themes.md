# Themes

By default, this library renders form fields and widgets leveraging the [Bootstrap](http://getbootstrap.com/) semantics,
meaning that you must load the Bootstrap stylesheet on the page to view the form properly. You can use another theme by importing one of the packages listed below.

## Supported themes

| Theme Name            | Status    | Package Name / Link     |
| --------------------- | --------- | ----------------------- |
| antd                  | Published | `@rjsf/antd`            |
| Bootstrap 3 (default) | Published | `@rjsf/core`            |
| react-bootstrap       | Published | `@rjsf/react-bootstrap` |
| Chakra UI             | Published | `@rjsf/chakra-ui`       |
| fluent-ui             | Published | `@rjsf/fluent-ui`       |
| fluentui-rc           | Published | `@rjsf/fluentui-rc`     |
| material-ui 5         | Published | `@rjsf/mui`             |
| Semantic UI           | Published | `@rjsf/semantic-ui`     |

## Using themes

To use a theme from a package, just import the `<Form />` component from that package. For example, to use the Material UI form,
first install both `@rjsf/core` and `@rjsf/mui`. Then you can import the form by doing:

```ts
import Form from '@rjsf/mui';
```

If you would like to contribute a theme with a new UI framework, please develop the theme using the `withTheme` component described in [Theme Customization](../advanced-customization/custom-themes.md) and make a PR!

You can also use the uiSchema to add custom CSS class names to your form.
