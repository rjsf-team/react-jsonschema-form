# Themes

By default, this library renders form fields and widgets as plain HTML5 markup with no CSS framework's classes, marked by `rjsf-` prefixed class names, and `@rjsf/core/rjsf.css` is an optional stylesheet that styles that markup with HTML5 and CSS3 alone.
Every rule in it is a zero-specificity `:where(.rjsf …)`, so your own CSS overrides it, and its colors and spacing are the custom properties `--rjsf-gap`, `--rjsf-radius`, `--rjsf-border`, `--rjsf-muted`, `--rjsf-danger`, `--rjsf-accent` and `--rjsf-surface`, whose `light-dark()` values follow the `color-scheme` your page declares.
You can use a theme built on a UI framework by importing one of the packages listed below.

## Supported themes

| Theme Name      | Status     | Package Name / Link     |
| --------------- | ---------- | ----------------------- |
| antd            | Published  | `@rjsf/antd`            |
| Bootstrap 3     | Deprecated | `@rjsf/bootstrap3`      |
| Chakra UI       | Published  | `@rjsf/chakra-ui`       |
| Daisy UI        | Published  | `@rjsf/daisyui`         |
| fluentui-rc     | Published  | `@rjsf/fluentui-rc`     |
| mantine         | Published  | `@rjsf/mantine`         |
| material-ui     | Published  | `@rjsf/mui`             |
| react-bootstrap | Published  | `@rjsf/react-bootstrap` |
| shadcn          | Published  | `@rjsf/shadcn`          |

## Using themes

To use a theme from a package, just import the `<Form />` component from that package. For example, to use the Material UI form,
first install both `@rjsf/core` and `@rjsf/mui`. Then you can import the form by doing:

```ts
import Form from '@rjsf/mui';
```

Each theme renders against its own UI framework, so the framework's stylesheet has to be loaded for the form to look
right. `@rjsf/shadcn` ships no stylesheet of its own: it is styled by your application's Tailwind build and CSS
variables, the same way shadcn components are. See the
[`@rjsf/shadcn` README](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/shadcn/README.md#theming)
for the one-line `@source` setup.

If you would like to contribute a theme with a new UI framework, please develop the theme using the `withTheme` component described in [Theme Customization](../advanced-customization/custom-themes.md) and make a PR!

You can also use the uiSchema to add custom CSS class names to your form.

## Customizing with other frameworks

The default theme is `@rjsf/core`'s unstyled markup. In order to use another theme, you must first install `@rjsf/core`.

For example, to use the plain form with its optional stylesheet, you can run:

```ts
import Form from '@rjsf/core';
import '@rjsf/core/rjsf.css';
```

The Bootstrap 3 markup `@rjsf/core` rendered through v6 is `@rjsf/bootstrap3`, deprecated and removed in v8.

To use the material-ui form, you should first install both `@rjsf/core` and `@rjsf/mui`. Then, you can run:

```ts
import Form from '@rjsf/mui';
```

For more information on how to create a custom theme, see documentation on the `withTheme` component.
