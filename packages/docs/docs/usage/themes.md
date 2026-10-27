# Themes

By default, this library renders form fields and widgets as plain HTML5 markup with no CSS framework's classes, marked by `rjsf-` prefixed class names, and two optional stylesheets style that markup with HTML5 and CSS3 alone, so taking the structure doesn't mean taking the look:

- `@rjsf/core/rjsf.css` is the layout: the field gap, the `fieldset` and `legend` reset, the label as a block, the option rows, the alt-date and range rows, the array item beside its toolbox, the additional-property row, the add button and the [layout grid](./layout-grid.md)'s rows and columns. Its custom properties are `--rjsf-gap`, the spacing, and `--rjsf-control-row`, the grid row it puts an array item's buttons and an additional property's key input and remove button on, past the field's label and description. It needs `:has()` and `subgrid`: Chrome and Edge 117, Safari 16.4 and Firefox 121 or later (browsers from 2023). It is the file an app with its own design system imports, or copies and owns.
- `@rjsf/core/rjsf-theme.css` is a default look on top of it: the input borders and padding, the error colors, the error list's box, the button borders and the disabled opacity. Its colors are the custom properties `--rjsf-radius`, `--rjsf-border`, `--rjsf-muted`, `--rjsf-danger`, `--rjsf-accent` and `--rjsf-surface`, whose `light-dark()` values follow the `color-scheme` your page declares (browsers from 2024). It is a starting point, not a design system. Import it after `rjsf.css`, as below. For a [`FieldTemplate` of your own](#lining-up-a-custom-fieldtemplate), it sets `--rjsf-toolbox-description-offset`, `rjsf.css`'s offset of an array item's buttons past a description, for its own description spacing.

Every rule in both is a zero-specificity `:where(.rjsf …)`, so your own CSS overrides it, and both sit in `@layer rjsf`, so unlayered CSS beats them whatever its specificity. A Tailwind app puts them above its preflight, whose `margin: 0`, `padding: 0` and `border: 0` would otherwise undo them, and beneath its utilities, by declaring the layer order once: `@layer theme, base, rjsf, components, utilities;`.

Core marks a field's state with attributes rather than classes, so a stylesheet selects on them: `data-invalid="true"` on the field's wrapper, label, description and help while it shows its own errors, and `data-disabled="true"` on a checkbox or radio option that is disabled or read-only. Each is absent rather than `"false"`, and sits on each part, so a nested field's label doesn't take its parent's state: `.rjsf-field-label[data-invalid]`, or `data-invalid:text-red-600` in Tailwind. The wrapper also keeps its `rjsf-field-error` class, the marker every theme's wrapper carries, for CSS that reaches the wrapper under any theme. An array item carries `data-display-label="true"` while its field draws a label above its control, and `data-has-description="true"` while the item has a description, which `rjsf.css` moves the item's toolbox down by for a [`FieldTemplate` of your own](#lining-up-a-custom-fieldtemplate) whose parts it can't line up with.
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
This map is the Tailwind equivalent of every rule in `rjsf.css` whose element has a class map key, but for the rows that line the array item's toolbox up with its field's control, which depend on the field's label and description. Tailwind's base styles already reset the `fieldset`, the lists and `box-sizing`, so those parts of `rjsf.css` need no classes:

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
  // Only an item with a toolbox takes its track, as the gap before an empty one would narrow the item's fields
  // A column gap only: `rjsf.css` lays a field's parts out on the item's rows, with no gap between them
  arrayItem: 'grid grid-cols-1 has-[>.rjsf-array-item-toolbox]:grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 mb-3',
  arrayItemToolbox: 'flex gap-1',
  arrayFieldset: 'min-w-0',
  objectFieldset: 'min-w-0',
};

render(<Form schema={schema} validator={validator} classMap={layout} />, document.getElementById('app'));
```

The rest of `rjsf.css` lays out elements the class map has no key for, or reaches them through the markup around them: the gap between fields, the `legend` and the optional-data control in it, the array item's rows, which line its toolbox up with its field's control, the add button, the additional-property row, the cyclic-schema box and the [layout grid](./layout-grid.md)'s rows and columns.
For those, keep `rjsf.css` above Tailwind's preflight and beneath your utilities, where the classes above win over its rules for the elements that have a key:

```css
@layer theme, base, rjsf, components, utilities;
@import 'tailwindcss';
@import '@rjsf/core/rjsf.css';
```

State is styled the same way, with a variant on the attribute core sets, such as `fieldLabel: 'block mb-1 data-invalid:text-red-600'` or `checkboxWrapper: 'my-1 data-disabled:opacity-50'`.
`@rjsf/daisyui` and `@rjsf/shadcn` are fuller examples of the keyed rules: each declares a `classMap` and keeps its own templates where its markup differs from core's.

## Lining up a custom `FieldTemplate`

`rjsf.css` lines an array item's buttons, and an additional property's key input and remove button, up with the field's control however far a wrapping label or description pushes it down.
It lays the field's parts out on the row's grid rows, one part to a row, and puts the buttons and the key's input on the control's row, `--rjsf-control-row`.
It finds the label by its class and the description by its class or its id, so a `FieldTemplate` of your own gets the same layout when it:

- renders its parts inside `WrapIfAdditionalTemplate`, passing it the template's props, as core's `FieldTemplate` does;
- draws them as that wrapper's direct children, one element each, in this order: the label, with the class `rjsf-field-label`, then the description, then the control, the errors and the help; the label and description are counted only from the first child, so one drawn below the control doesn't move the buttons;
- draws no more than eight direct children, as the rows are fixed at eight; anything past that shares the last row, so wrap extra parts in one element.

Give `.rjsf-array-item` and `.rjsf-additional-property` only a column gap (`column-gap`, or `gap-x-*` in a class map): a row gap spaces all eight rows, empty or not.

Core's `DescriptionFieldTemplate` carries `rjsf-field-description`, and a `DescriptionFieldTemplate` of your own keeps the layout if its outer element carries the `id` it is given, as the control's `aria-describedby` needs, or that class. One that carries neither, under core's label, still takes a row but isn't counted, so the buttons sit on the description rather than the control, further off than the fixed offsets below leave them. Core's `FieldLabel` carries only the classes you pass it, so pass it `rjsf-field-label`:

```tsx
import { FieldLabel } from '@rjsf/core';
import type { FieldTemplateProps } from '@rjsf/utils';
import {
  getTemplates,
  getUiOptions,
  templateDrawsDescription,
  templateDrawsLabel,
  templateLabelFor,
  templateMarksRequired,
} from '@rjsf/utils';

function CustomFieldTemplate(props: FieldTemplateProps) {
  const { label, children, errors, help, description, hidden, hasErrors, presentation, registry, uiSchema } = props;
  const { WrapIfAdditionalTemplate } = getTemplates(registry, getUiOptions(uiSchema));
  if (hidden) {
    return <div hidden>{children}</div>;
  }
  return (
    <WrapIfAdditionalTemplate {...props}>
      {templateDrawsLabel(props) && (
        <FieldLabel
          label={label}
          required={templateMarksRequired(props)}
          id={templateLabelFor(props)}
          labelId={presentation?.label.id}
          className='rjsf-field-label my-label'
          invalid={hasErrors}
        />
      )}
      {templateDrawsDescription(props) && description}
      {children}
      {errors}
      {help}
    </WrapIfAdditionalTemplate>
  );
}
```

A template without those classes, or with its parts nested in elements of its own, keeps a simpler layout: an array item's buttons are moved down past a label and a description by fixed offsets, read from the item's `data-display-label` and `data-has-description`, that assume each is one line, and an additional property's key input sits right under its label, so a description above the value's input leaves the key's input higher than it.
`@rjsf/shadcn`'s class map reads the same classes, so the same holds under that theme.
