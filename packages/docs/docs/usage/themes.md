# Themes

By default, this library renders form fields and widgets as plain HTML5 markup with no CSS framework's classes, marked by `rjsf-` prefixed class names, and two optional stylesheets style that markup with HTML5 and CSS3 alone, so taking the structure doesn't mean taking the look:

- `@rjsf/core/rjsf.css` is the layout: the field gap, the `fieldset` and `legend` reset, the label as a block, the option rows, the alt-date and range rows, the array item beside its toolbox, the additional-property row, the add button and the [layout grid](./layout-grid.md)'s rows and columns. Its one custom property is `--rjsf-gap`. It is the file an app with its own design system imports, or copies and owns.
- `@rjsf/core/rjsf-theme.css` is a default look on top of it: the input borders and padding, the error colors, the error list's box, the button borders and the disabled opacity. Its colors are the custom properties `--rjsf-radius`, `--rjsf-border`, `--rjsf-muted`, `--rjsf-danger`, `--rjsf-accent` and `--rjsf-surface`, whose `light-dark()` values follow the `color-scheme` your page declares (browsers from 2024). It is a starting point, not a design system.

Every rule in both is a zero-specificity `:where(.rjsf …)`, so your own CSS overrides it, and both sit in `@layer rjsf`, so unlayered CSS beats them whatever its specificity. A Tailwind app puts them above its preflight, whose `margin: 0`, `padding: 0` and `border: 0` would otherwise undo them, and beneath its utilities, by declaring the layer order once: `@layer theme, base, rjsf, components, utilities;`.

Core marks a field's state with attributes rather than classes, so a stylesheet selects on them: `data-invalid="true"` on the field's wrapper, label, description and help while it shows its own errors, and `data-disabled="true"` on a checkbox or radio option that is disabled or read-only. Each is absent rather than `"false"`, and sits on each part, so a nested field's label doesn't take its parent's state: `.rjsf-field-label[data-invalid]`, or `data-invalid:text-red-600` in Tailwind.
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
import '@rjsf/core/rjsf-theme.css';
```

The Bootstrap 3 markup `@rjsf/core` rendered through v6 is `@rjsf/bootstrap3`, deprecated and removed in v8.

To use the material-ui form, you should first install both `@rjsf/core` and `@rjsf/mui`. Then, you can run:

```ts
import Form from '@rjsf/mui';
```

For more information on how to create a custom theme, see documentation on the `withTheme` component.

## Laying out core's markup with Tailwind

An app built on Tailwind can lay out most of core's markup through the [class map](../advanced-customization/custom-themes.md#class-map), so it follows the app's own spacing scale.
This map is the Tailwind equivalent of every rule in `rjsf.css` whose element has a class map key. Tailwind's base styles already reset the `fieldset`, the lists and `box-sizing`, so those parts of `rjsf.css` need no classes:

```tsx
import Form from '@rjsf/core';
import type { ClassMap } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const layout: ClassMap = {
  fieldLabel: 'block mb-1',
  input: 'w-full',
  select: 'w-full',
  textarea: 'w-full',
  checkboxWrapper: 'my-1',
  radioWrapper: 'my-1',
  checkboxLabel: 'inline-flex items-center',
  radioLabel: 'inline-flex items-center',
  checkboxInlineLabel: 'inline-flex items-center me-3',
  radioInlineLabel: 'inline-flex items-center me-3',
  // The option's text is the `<span>` after its input
  checkboxInput: 'm-0 align-middle [&+span]:ms-1.5 [&+span]:align-middle',
  radioInput: 'm-0 align-middle [&+span]:ms-1.5 [&+span]:align-middle',
  altDateList: 'flex flex-wrap gap-3',
  rangeWrapper: 'flex items-center gap-3',
  arrayItem: 'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3',
  arrayItemToolbox: 'flex gap-1',
  arrayFieldset: 'min-w-0',
  objectFieldset: 'min-w-0',
};

render(<Form schema={schema} validator={validator} classMap={layout} />, document.getElementById('app'));
```

The rest of `rjsf.css` lays out elements the class map has no key for: the gap between fields, the `legend` and the optional-data control in it, the add button, the additional-property row, the cyclic-schema box and the [layout grid](./layout-grid.md)'s rows and columns.
For those, keep `rjsf.css` above Tailwind's preflight and beneath your utilities, where the classes above win over its rules for the elements that have a key:

```css
@layer theme, base, rjsf, components, utilities;
@import 'tailwindcss';
@import '@rjsf/core/rjsf.css';
```

State is styled the same way, with a variant on the attribute core sets, such as `fieldLabel: 'block mb-1 data-invalid:text-red-600'` or `checkboxWrapper: 'my-1 data-disabled:opacity-50'`.
`@rjsf/daisyui` and `@rjsf/shadcn` are fuller Tailwind examples, which render their own templates rather than core's.
