# Themes

By default, this library renders form fields and widgets leveraging the [Bootstrap](http://getbootstrap.com/) semantics,
meaning that you must load the Bootstrap stylesheet on the page to view the form properly. You can use another theme by importing one of the packages listed below.

## Supported themes

| Theme Name            | Status    | Package Name / Link |
| --------------------- | --------- | ------------------- |
| Bootstrap 3 (default) | Published | `@rjsf/core`        |
| Bootstrap 4           | Published | `@rjsf/bootstrap-4` |
| material-ui 4 & 5     | Published | `@rjsf/material-ui` |
| fluent-ui             | Published | `@rjsf/fluent-ui`   |
| antd                  | Published | `@rjsf/antd`        |
| Semantic UI           | Published | `@rjsf/semantic-ui` |
| Chakra UI             | Published | `@rjsf/chakra-ui`   |

## Using themes

To use a theme from a package, just import the `<Form />` component from that package. For example, to use the material ui form,
first install both `@rjsf/core` and `@rjsf/material-ui`. Then you can import the form by doing:

```js
import Form from "@rjsf/material-ui";
```

If you would like to contribute a theme with a new UI framework, please develop the theme using the `withTheme` component described in [Theme Customization](../advanced-customization/custom-themes.md) and make a PR!

You can also use the uiSchema to add custom CSS class names to your form.

## Customizing with other frameworks

The default theme is bootstrap 3. In order to use another theme, you must first install `@rjsf/core`.

For example, to use the standard bootstrap 3 form, you can run:

```js
import Form from "@rjsf/core";
```

To use the material-ui form, you should first install both `@rjsf/core` and `@rjsf/material-ui`. Then, you can run:

```js
import Form from "@rjsf/material-ui";
```

For more information on how to create a custom theme, see documentation on the `withTheme` component.
