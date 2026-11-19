---
title: Under realValue, object, null, empty and colliding enum options get an index-prefixed DOM value
description: "In the `realValue` format, options that stringify alike shared a DOM value, objects used a bare index and `null` an empty string. Each now encodes as `__rjsf_index:<i>`, so code that reads or sets these DOM values must expect the prefix."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema, markup]
schema: [enums]
affects: [code, data]
related: [enum-option-value-encoder-removed]
---

## Detect

- In your `uiSchema`, `ui:optionValueFormat: 'realValue'` on a field whose options include objects, arrays, `null`, `''`, a string starting with `__rjsf_index:`, or values whose `String()` is the same, such as `1` and `'1'` or `true` and `'true'`.
- In your tests or code, reading an option's DOM `value`, or setting one, such as `selectOptions(select, '0')`.

## Change

Options whose `String()` is the same used to share a DOM value, so the second of them could not be picked and picking it wrote the first one's value ([#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315)). Each of them now gets its prefixed index, such as `__rjsf_index:1`.

An object, array, `null` or empty string option, and a string starting with the prefix, also encodes as its index prefixed with `__rjsf_index:`. v6 encoded objects and arrays as the bare index and `null` as the empty string ([#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309)).

Update code that parses these DOM values itself to expect the prefix, or decode them with `enumOptionValueDecoder()`:

```diff
-await user.selectOptions(select, '1');
+await user.selectOptions(select, '__rjsf_index:1');
```

## Verify

- Every option, including the second of two that stringify alike, can be picked and writes its own value.
- Snapshots show the prefixed DOM values; update them.
