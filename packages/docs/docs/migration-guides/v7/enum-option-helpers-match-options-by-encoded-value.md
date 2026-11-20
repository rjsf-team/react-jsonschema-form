---
title: The enum option helpers match values the way enumOptionsDomValues encodes them
description: The `@rjsf/utils` enum helpers used to compare values with `String()`, by reference or by bare index; they now match the encoding of `enumOptionsDomValues()` by value. Check custom widgets that call them and use `enumOptionsValueForIndex()` for a position.
packages: ['@rjsf/utils']
uses: [custom-widgets, utils-api]
schema: [enums]
affects: [code, data]
related: [enum-option-value-encoder-removed, enum-option-value-is-unknown, enum-option-dom-values-use-index-prefix]
---

## Detect

- In your custom widget, a call to `enumOptionSelectedValue()`, `enumOptionsIsSelected()`, `enumOptionsIndexForValue()`, `enumOptionsSelectValue()` or `enumOptionValueDecoder()` from `@rjsf/utils`.
- In your schema, options whose values are objects, arrays, `null`, `''`, or numbers that equal another option's position.

## Change

Use these helpers together with `enumOptionsDomValues()` (see [enumOptionValueEncoder() is removed in favor of enumOptionsDomValues()](./enum-option-value-encoder-removed.md) and [Under realValue, object, null, empty and colliding enum options get an index-prefixed DOM value](./enum-option-dom-values-use-index-prefix.md)). They return `unknown` values (see [An enum option value is typed unknown](./enum-option-value-is-unknown.md)).

- `enumOptionSelectedValue()` in the `realValue` format encodes the selected value the way `enumOptionsDomValues()` encodes options, instead of with `String()`, so a selected object or `null` matches its option. It no longer reports no selection because the value equals the widget's `emptyValue`, so an option holding that `null` or `''` shows as selected. An entry of a multiple selection that matches no option is left out, as the `indexed` format already did.
- `enumOptionsIsSelected()` takes an optional third `multiple` argument. A single-select widget passes `false`, so an array `selected` is compared as the whole value of an array option such as `{ "const": [2] }`. Omitted, an array is still a list of selections. `enumOptionsIndexForValue()` prefers an option matching the whole value when not `multiple`. The radio widgets pass `false`.
- `enumOptionsSelectValue()` compares by deep equality and accepts a `null` option, so a selected object option lands in the options' order whether or not the data holds the option's own instance. It no longer adds a value that is already selected, and keeps a selected value that matches no option after the ones that do.
- `enumOptionValueDecoder()` in the `realValue` format decodes a string to the option `enumOptionsDomValues()` encodes as that string, and no longer falls back to the option at a bare index, which returned the wrong option when a number option's value equaled another option's position. A widget that holds an option's position resolves it with `enumOptionsValueForIndex()`:

```diff
-const value = enumOptionValueDecoder(String(index), enumOptions, 'realValue', emptyValue);
+const value = enumOptionsValueForIndex(index, enumOptions, emptyValue);
```

A single-select widget of your own that checks selection passes `false`:

```diff
-enumOptionsIsSelected(option.value, value);
+enumOptionsIsSelected(option.value, value, false);
```

## Verify

- A selected object, array or `null` option shows as selected in your widget.
- A checkbox list keeps selections in option order with no duplicates.
