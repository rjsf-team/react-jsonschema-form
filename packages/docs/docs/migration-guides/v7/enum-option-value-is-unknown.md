---
title: 'An enum option value is typed unknown'
description: 'An enum option `value`, the enum helpers and `UIOptionsType.emptyValue` are now typed `unknown` instead of `any`. Compare with `===` or `deepEquals()`, render labels, and encode DOM values with `enumOptionsDomValues()`.'
packages: ['@rjsf/utils']
uses: [typescript, custom-widgets, utils-api]
schema: []
affects: [code]
related: [enum-value-type-includes-null-objects-and-arrays, enum-option-value-encoder-removed, form-data-type-defaults-to-unknown]
---

## Detect

- In a custom widget: `option.value`, `options.emptyValue` or a `ui:options` value used as a string, number or other narrower type.
- In your code: results of `enumOptionsSelectValue()`, `enumOptionsDeselectValue()`, `enumOptionsValueForIndex()` or `enumOptionSelectedValue()` used as a narrower type, or `enumOptionSelectedValue<S>(...)` called with explicit type arguments and an `emptyValue`.
- In the type checker: `TS18046: 'option.value' is of type 'unknown'.`, `TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number'.` from `enumDisabled.includes(option.value)`, or `TS2322: Type 'unknown' is not assignable to type 'string | number | readonly string[] | undefined'.` from `value={option.value}`.

## Change

An enum option's `value` can be any JSON value an `enum`, `const` or `examples` entry holds, so it is typed `unknown`. `enumOptionsSelectValue()`, `enumOptionsDeselectValue()` and `enumOptionsValueForIndex()` return `unknown` values. `enumOptionSelectedValue()` takes `value` as `unknown` and returns a `string` (a `string[]` when `multiple`) or its `emptyValue` (`undefined` when omitted). Its second type parameter is the type of `emptyValue` and defaults to `undefined`, so a call passing `<S>` with an `emptyValue`, as the v6 themes did, no longer compiles: drop the type arguments, or pass `<S, typeof emptyValue>`. `UIOptionsType.emptyValue` is `unknown`, as is every `ui:options` value read through the index signature. Nothing changes at runtime. The wider type defaults are in [Form data defaults to unknown](./form-data-type-defaults-to-unknown.md).

- Compare values with `===`, or `deepEquals()` from `@rjsf/utils` for objects and arrays, instead of `includes()`. For `ui:enumDisabled`, use `enumOptionsIsDisabled()`, which also matches objects and arrays by deep equality.
- Render an option's `label`, not its value.
- An `unknown` value doesn't fit a `value` attribute, and `String()` turns objects into `"[object Object]"` and arrays into a comma-joined list. Encode the options with `enumOptionsDomValues()`, reading each DOM value at its index, and decode in the change handler with `enumOptionValueDecoder()`, as the built-in select widgets do. Both must use the format `getOptionValueFormat(options)` reads from `ui:optionValueFormat`. `enumOptionsDomValues()` replaces `enumOptionValueEncoder()`; see [enumOptionValueEncoder() is removed](./enum-option-value-encoder-removed.md).

```diff
+import {
+  enumOptionSelectedValue,
+  enumOptionsDomValues,
+  enumOptionsIsDisabled,
+  enumOptionValueDecoder,
+  getOptionValueFormat,
+} from '@rjsf/utils';
+
+const { enumOptions = [], enumDisabled, emptyValue } = options;
+const optionValueFormat = getOptionValueFormat(options);
+const domValues = enumOptionsDomValues(enumOptions, optionValueFormat);
-<select value={value} onChange={(event) => onChange(event.target.value)}>
-  {enumOptions.map((option) => (
-    <option key={option.value} value={option.value} disabled={enumDisabled.includes(option.value)}>
-      {option.value}
-    </option>
-  ))}
-</select>
+<select
+  value={enumOptionSelectedValue(value, enumOptions, false, optionValueFormat, '')}
+  onChange={(event) => onChange(enumOptionValueDecoder(event.target.value, enumOptions, optionValueFormat, emptyValue))}
+>
+  {enumOptions.map((option, index) => (
+    <option
+      key={domValues[index]}
+      value={domValues[index]}
+      disabled={enumOptionsIsDisabled(option.value, enumDisabled)}
+    >
+      {option.label}
+    </option>
+  ))}
+</select>
```

## Verify

- Your widget compiles without casts to `any`.
- Selecting an object or array option writes that value to the form data, and the select shows it as selected.
