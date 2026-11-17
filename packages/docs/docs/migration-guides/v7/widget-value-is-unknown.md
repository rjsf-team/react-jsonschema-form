---
title: A widget's value and the value its handlers take are unknown
description: 'A widget''s `value`, the values `onChange`, `onBlur` and `onFocus` take, and the file and alt-date hook values were `any` or loose unions and are now `unknown`. Narrow the value before use, or pass it through `toInputValue()`.'
packages: ['@rjsf/utils']
uses: [typescript, custom-widgets, custom-fields]
schema: []
kind: type
noticed: type-error
related: [alt-date-widgets-read-only-string-dates]
---

## Detect

- In your code: a custom widget or `BaseInputTemplate` that uses `value` from `WidgetProps` or `BaseInputTemplateProps` as a string, number or array.
- In your code: a component that uses the `value` from `useFileWidgetProps()`, or passes typed values to its `onChange`.
- In your code: a component that uses `DateElementProps.value`, or calls `select` or `handleChange` from `useAltDateWidgetProps()` with a typed value.
- In your code: an `onBlur` or `onFocus` handler passed to a widget or field whose value parameter has a type other than `unknown`.
- The type checker reports `'value' is of type 'unknown'.` (TS18046), or that a handler's type is not assignable to the prop.

## Change

`WidgetProps.value` and `BaseInputTemplateProps.value` were `any` and are now `unknown`. A `ui:widget` can point any widget at data of any type, and some fields hand their widgets a value that isn't the field's data, such as the option index `MultiSchemaField` gives its selector. Narrow the value before use. [`toInputValue()`](../../api-reference/utility-functions.md#toinputvalue) turns it into what an input's `value` prop takes:

```diff
-const MyWidget = ({ value, onChange }: WidgetProps) => <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
+const MyWidget = ({ value, onChange }: WidgetProps) => (
+  <input value={toInputValue(value)} onChange={(e) => onChange(e.target.value)} />
+);
```

The value `WidgetProps.onChange` and `FieldProps.onChange` take was `any` or `T | undefined` and is now `unknown`, as is the one `onBlur` and `onFocus` take on both. Whatever a widget passes to `onChange` is `unknown` to it, since the field it reports to decides what the value means. A field's `onChange` takes an `unknown` value too, since a change reported from inside the field carries the value at the deeper `FieldPath` it names. A handler you pass as the `onChange` of a widget or a field can still declare the type it expects. One you pass as `onBlur` or `onFocus` has to take an `unknown` value.

The `value` of `useFileWidgetProps()` was `string | string[] | undefined | null`, and the value its `onChange` takes was `string | null | (string | null)[]`. Both are now `unknown`.

`DateElementProps.value` was `any` and is now `number | undefined`. The value `select` and `handleChange` take in `useAltDateWidgetProps()` was `string` and is now `unknown`.

## Verify

- The type checker accepts your widgets, fields and templates, with every use of `value` narrowed first.
- Your `onBlur` and `onFocus` handlers take an `unknown` value.
- Nothing changes at runtime for these types. The alt-date widgets read only strings, see [The alt-date and alt-datetime widgets show a number or Date value as empty](./alt-date-widgets-read-only-string-dates.md).
