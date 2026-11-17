---
title: A SelectWidget or RadioWidget of your own applies the names rjsf hands it
description: Date parts and unlabelled selects and radio groups now get their names through props a replacement widget must apply. Spread `widgetAriaProps(props)` on your select, and pass `label`, `placeholder` and `registry` to `getGroupAttributes()` in your radio widget.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-widgets, custom-fields]
schema: [dates, enums]
kind: runtime
noticed: review
related: [alt-date-parts-named-by-field-label, presentation-declares-description-order, alt-date-unset-part-is-undefined, widget-reads-the-presentation-plan]
---

## Detect

- In your code, a `SelectWidget` or `RadioWidget` passed in `widgets` or a theme, replacing the theme's own.
- A custom `ui:field` that renders the registry's `SelectWidget` and hands it its `presentation`.
- On the rendered page, `AltDateWidget` parts or untitled selects with no accessible name.

## Change

`DateElement` hands each date part's name and description to the registry's `SelectWidget` as its `aria-label` and `aria-describedby`. Every theme's `SelectWidget` gives them to the control a screen reader focuses through the new [`widgetAriaProps()`](../../api-reference/utility-functions.md#widgetariaprops), which describes it by the caller's ids and, while it shows one, by the id of the selected option's description, listed where it is drawn among the field's description and help.

A replacement `SelectWidget` must do the same, or the date parts it renders are left unnamed and undescribed. No other widget is required to honor the two props:

```tsx
import { widgetAriaProps } from '@rjsf/utils';

function MySelectWidget(props: WidgetProps) {
  return <select id={props.id} {...widgetAriaProps(props)}>{/* ... */}</select>;
}
```

`widgetAriaProps()` also names a select no label names by its `ui:placeholder`, else `TranslatableString.SelectPlaceholder` ("Select ..."). A replacement `SelectWidget` that draws its field's label itself, as [`widgetDrawsLabelText(props)`](../../api-reference/utility-functions.md#widgetdrawslabeltext) says, takes no such name, since that label names the select. One whose plan has it draw its label must draw it, or the select is left with no name.

So must a custom `ui:field` that hands its `presentation` on to the registry's `SelectWidget`, since that plan has the field draw the label: it draws one or passes the widget an `aria-label`.

[`getGroupAttributes()`](../../api-reference/utility-functions.md#getgroupattributes) names a `radiogroup` no label names the same way, by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option"), when the widget passes it its `label`, `placeholder` and `registry`, as every theme's `RadioWidget` does. A replacement `RadioWidget` should pass them too ([#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586)).

A replacement `SelectWidget` also receives `undefined` for an unset date part; see [An unset AltDateWidget date part is undefined in every theme](./alt-date-unset-part-is-undefined.md).

## Verify

Run `controlNameTests(Form)` from `@rjsf/snapshot-tests` against your theme's `Form`. It checks that date parts, unlabelled selects and radio groups are named.
