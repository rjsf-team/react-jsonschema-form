---
title: enumOptionValueEncoder() is removed in favor of enumOptionsDomValues()
description: "`enumOptionValueEncoder()` encoded one option at a time and is gone. Encode the whole list once with `enumOptionsDomValues(enumOptions, optionValueFormat)` and read each option's DOM value at its index."
packages: ['@rjsf/utils']
uses: [custom-widgets, utils-api]
schema: [enums]
affects: [code]
related: [enum-option-dom-values-use-index-prefix, enum-option-value-is-unknown]
---

## Detect

- In your code, an import of `enumOptionValueEncoder` from `@rjsf/utils`, such as in a custom select, radio or checkboxes widget.
- The type checker reports `'"@rjsf/utils"' has no exported member named 'enumOptionValueEncoder'. Did you mean 'enumOptionValueDecoder'?` (TS2724)

## Change

In the `realValue` format an option's DOM value now depends on the rest of the list, so one option can't be encoded alone ([#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315)). The new [`enumOptionsDomValues()`](../../api-reference/utility-functions.md#enumoptionsdomvaluess-extends-strictrjsfschema--rjsfschema) encodes the whole list in one pass, and `enumOptionValueDecoder()` and `enumOptionSelectedValue()` encode against the list the same way.

Encode the options once per render and read each option's value at its position:

```diff
+const domValues = enumOptionsDomValues(enumOptions, optionValueFormat);
 // ...
-value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
+value={domValues[index]}
```

For options from `groupEnumOptions()`, read `domValues[option.index]`, since `index` is the option's position in the ungrouped list.

The DOM values themselves changed for some options; see [Under realValue, object, null, empty and colliding enum options get an index-prefixed DOM value](./enum-option-dom-values-use-index-prefix.md).

## Verify

- The type checker accepts your widget.
- Picking each option in your widget writes that option's value to the form data.
