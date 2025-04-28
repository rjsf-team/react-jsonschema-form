# Themes

By default, this library renders form fields and widgets leveraging the [Bootstrap](http://getbootstrap.com/) semantics,
meaning that you must load the Bootstrap stylesheet on the page to view the form properly. You can use another theme by importing one of the packages listed below.

## Supported themes

| Theme Name                 | Status    | Package Name / Link                                                                                                     |
| -------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| antd                       | Published | [`@rjsf/antd`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/antd#readme)                       |
| Chakra UI                  | Published | [`@rjsf/chakra-ui`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/chakra-ui#readme)             |
| Core (default)             | Published | [`@rjsf/core`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/core#readme)                       |
| DaisyUI                    | Published | [`@rjsf/daisyui`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/daisyui#readme)                 |
| Fluent UI React Components | Published | [`@rjsf/fluentui-rc`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/fluentui-rc#readme)         |
| MUI                        | Published | [`@rjsf/mui`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/mui#readme)                         |
| React Bootstrap            | Published | [`@rjsf/react-bootstrap`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/react-bootstrap#readme) |
| Semantic UI                | Published | [`@rjsf/semantic-ui`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/semantic-ui#readme)         |
| Shadcn                     | Published | [`@rjsf/shadcn`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/shadcn#readme)                   |
| USWDS                      | Published | [`@rjsf/uswds`](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/uswds#readme)                     |

## Using themes

To use a theme from a package, just import the `<Form />` component from that package. For example, to use the Material UI form,
first install both `@rjsf/core` and `@rjsf/mui`. Then you can import the form by doing:

```ts
import Form from '@rjsf/mui';
```

If you would like to contribute a theme with a new UI framework, please develop the theme using the `withTheme` component described in [Theme Customization](../advanced-customization/custom-themes.md) and make a PR!

You can also use the uiSchema to add custom CSS class names to your form.

## Customizing with other frameworks

The default theme is bootstrap 3. In order to use another theme, you must first install `@rjsf/core`.

For example, to use the standard bootstrap 3 form, you can run:

```ts
import Form from '@rjsf/core';
```

To use the material-ui 5 form, you should first install both `@rjsf/core` and `@rjsf/mui`. Then, you can run:

```ts
import Form from '@rjsf/material-ui';
```

To use the USWDS form, you should first install both `@rjsf/core` and `@rjsf/uswds`, and ensure you have included the USWDS CSS in your project. Then, you can run:

```ts
import Form from '@rjsf/uswds';
```

For more information on how to create a custom theme, see documentation on the `withTheme` component.
