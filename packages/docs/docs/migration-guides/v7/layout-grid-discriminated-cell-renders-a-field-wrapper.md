---
title: 'A discriminated layout grid cell renders inside a full field wrapper'
description: 'A discriminated `oneOf`/`anyOf` cell of a `LayoutGridField` used to render outside `SchemaField`, missing classes and most `ui:` keys. It now renders like every other cell; check your CSS and that cell''s `uiSchema`.'
packages: ['@rjsf/core']
uses: [ui-schema, markup]
schema: [any-of-one-of]
kind: runtime
noticed: review
related: [layout-grid-cell-custom-selector-widget-and-template, custom-layout-multi-schema-field-renders-only-the-selector, layout-grid-cell-labelled-by-property-name, deep-imports-removed]
---

## Detect

- In your `uiSchema`: a `LayoutGridField` that lays out a discriminated `oneOf`/`anyOf`, whose option selector renders in a cell of its own.
- In your CSS: rules matching `.rjsf-field`, `.rjsf-field-<type>` or `.rjsf-field-error` that now also match that cell's wrapper.
- In that cell's `uiSchema` or schema: `ui:classNames`, `ui:style`, `ui:widget: 'hidden'`, `ui:description`, `ui:help`, `ui:disabled`, `ui:autofocus`, `deprecated`, a `$ref` with a `ui:definitions` entry, or no title.

## Change

`LayoutMultiSchemaField` rendered that cell outside any `SchemaField` and built its `FieldTemplate`'s props itself, so each prop it left out was missing for that one field ([#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327)). The grid now renders the cell through `SchemaField`, as it renders every other cell, and `LayoutMultiSchemaField` renders only the selector widget ([#5419](https://github.com/rjsf-team/react-jsonschema-form/issues/5419)). For a form that renders one of these cells:

- A rule matching `.rjsf-field`, `.rjsf-field-<type>` or `.rjsf-field-error` now matches the cell's wrapper. A rule meant to exclude these cells has to say so.
- `ui:classNames` and `ui:style` on the cell are applied by the `FieldTemplate` wrapper.
- The template is handed `hidden`, `formData`, `description`, `rawDescription`, `help` and `rawHelp`. A `ui:widget: 'hidden'` now hides the cell, where the widget used to render inside the full wrapper, and a `ui:description`, `schema.description` or `ui:help` on it now renders.
- `ui:disabled` and a `deprecated` schema are resolved as for any other field. `ui:disabled` disables the cell and its selector, and re-enables them when it is `false` on a form or grid that disables everything. A deprecated cell is hidden by `ui:deprecatedHandling: 'hide'`, disabled by `'disable'`, and under the `'label'` default gets the deprecation marker on its label, which its `FieldTemplate` and selector both receive.
- A cell with no title is labelled by its property name, as every other cell is, where it was unlabelled; see [An untitled nested layout grid cell is labelled by its property name](./layout-grid-cell-labelled-by-property-name.md). The selector is still named by its text.
- A `$ref` cell takes its `ui:definitions` entry, so a definition shared with a field elsewhere now gives the cell its `ui:widget`, `ui:title` and the rest.
- `ui:autofocus` on the cell focuses its selector, where nothing took focus.
- A selector property with no `type`, and none its `const` or `enum` implies, takes the type of the first option that isn't a boolean schema, declared or inferred, where it took the selected option's. Its widget no longer depends on the data, and a selector with no option selected renders, where it threw. With no option to take a type from, as when every option is a boolean schema, it is typed as an object, and takes its default widget or `select`, `radio` or `hidden`.
- A cell whose `oneOf`/`anyOf` is empty renders the field its schema would without the keyword, where it threw.

Give the cell a `ui:title`, or set `ui:label: false` to hide the label:

```diff
 const uiSchema = {
-  shape: {},
+  shape: { 'ui:title': 'Shape' },
 };
```

The type class is `rjsf-field-undefined` for the usual discriminated schema, `{ discriminator, oneOf: [{ $ref }, ...] }`, which declares no top-level `type`. A later release may drop that class or derive it from the selected option, so key rules off `.rjsf-field`, which every field carries.

`computeEnumOptions()` and `getSelectedOption()` can no longer be imported; see [Imports from a package's lib folder no longer resolve](./deep-imports-removed.md).

## Verify

- The cell's wrapper carries `rjsf-field` and your `ui:classNames`, and the description, help, label, disabled state and focus you set show on it.
- Your field-wide CSS rules style the cell as you intend.
