---
title: Core markup uses rjsf- prefixed marker classes and state attributes
description: Core's marker classes now carry the `rjsf-` prefix, field state is a `data-invalid` or `data-disabled` attribute, and buttons are `rjsf-button` with an inline SVG. Update CSS selectors, test queries and snapshots to match.
packages: ['@rjsf/core']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [bootstrap-3-markup-moved-to-bootstrap3, daisyui-renders-core-components, shadcn-renders-core-templates]
---

## Detect

- Selectors in your CSS or tests for `has-error`, `field-description`, `error-detail`, `errors`, `required`, `unsupported-field`, `field-radio-group`, `checkboxes`, `file-info`, `range-view`, `btn-now`, `btn-clear`, `btn-add`, `glyphicon`, or a `legend` heading a layout grid.
- Snapshot tests of forms rendered by `@rjsf/core`, or by a theme's components that fall back to core.
- CSS giving the `<form>` a `className` to keep `.rjsf` rules off it.

## Change

Every marker class core renders carries the `rjsf-` prefix. Rename the unprefixed ones in your selectors:

```diff
-.field-description,
-.error-detail {
+.rjsf-field-description,
+.rjsf-error-detail {
```

The same applies to `rjsf-errors`, `rjsf-required`, `rjsf-unsupported-field`, `rjsf-field-radio-group`, `rjsf-checkboxes`, `rjsf-file-info`, `rjsf-range-view`, `rjsf-btn-now`, `rjsf-btn-clear` and the like. New markers such as `rjsf-field-label`, `rjsf-field-help`, `rjsf-checkbox` and `rjsf-radio` sit on the elements that carried only a Bootstrap class.

A field's state is now an attribute. `data-invalid` sits on the field's wrapper, label, description and help while it shows its own errors, and `data-disabled` sits on a disabled or read-only checkbox or radio option. The wrapper keeps its `rjsf-field-error` class, which every theme's wrapper carries.

```diff
-.has-error .control-label {
+[data-invalid].rjsf-field-label {
```

Buttons render as `<button class="rjsf-button rjsf-button-{kind}">` with an inline SVG icon in place of a glyphicon. A hidden field uses the `hidden` attribute.

The `<form>` keeps its `rjsf` class beside the `className` prop. A form given a `className` to keep `.rjsf` rules off it now takes them, `rjsf.css` and `rjsf-theme.css` included.

`TitleField` renders a `<div class="rjsf-title">` where it heads no `<fieldset>`, as in a layout grid's header. Aim a `legend` selector for that title at `.rjsf-title`.

The other themes fall back to core for a few components, which render the prefixed markers too: `UnsupportedField` in every theme, `FileWidget` and `ColorWidget` in most, and `AltDateWidget` in `@rjsf/daisyui`, `@rjsf/fluentui-rc`, `@rjsf/mui`, `@rjsf/react-bootstrap` and `@rjsf/shadcn`. `@rjsf/react-bootstrap` gives `AltDateWidget` Bootstrap 5 classes through its `classMap`, and `@rjsf/daisyui` and `@rjsf/shadcn` give it their own. Those two themes render most of core's templates through a class map of their own, see [daisyUI](./daisyui-renders-core-components.md) and [shadcn](./shadcn-renders-core-templates.md).

Update snapshots after renaming selectors.

## Verify

- Error, description and help styles apply again on invalid fields.
- Test queries for buttons, errors and descriptions find their elements.
- Updated snapshots show only the `rjsf-` prefixed classes and the new attributes.
