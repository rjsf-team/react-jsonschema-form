---
title: Entries read from an untyped UiSchema are unknown
description: An entry read from an untyped `UiSchema`, from a field typed `any` or from `additionalProperties` used to be `any` and is now `unknown`. Cast the uiSchema to one typed by the data it describes, or narrow the entry before reading it.
packages: ['@rjsf/utils']
uses: [typescript, ui-schema, custom-fields, custom-widgets]
schema: []
kind: type
noticed: type-error
related: [bare-ui-schema-rejects-record-data, undeclared-ui-options-are-unknown]
---

## Detect

- In your code: an entry read, spread or destructured from a bare `UiSchema`, a `UiSchema<GenericObjectType>`, a `UiSchema<Record<string, unknown>>` or the field typed `any` of a typed one, such as `meta` in `UiSchema<{ meta: any }>`.
- The type checker reports `'…' is of type 'unknown'.` (TS18046) on the read, or `Spread types may only be created from object types.` (TS2698) on a spread.
- In your code: a function inside `additionalProperties` of a `UiSchema` with no type argument, or whose `T` has no index signature, such as an `items` function or an inline `ui:field`, whose parameter has no type.
- In a generic custom field: the rest of a `UiSchema<T, S, F>` spread into a new object that should be a `UiSchema<T, S, F>`.

## Change

An untyped `UiSchema` still accepts any nesting, but an entry read back from it is `unknown`, since nothing says what it holds. Cast the uiSchema you read to one typed by the data it describes, and narrow the value. Keep `WidgetProps`' own type argument, which is the widget's value type: the widget's `uiSchema` is typed by that value, so it needs a cast rather than an annotation to read it as another type. The cast checks nothing, so a wrong one compiles:

```diff
 function MyWidget({ uiSchema }: WidgetProps<string>) {
-  return <span>{uiSchema?.custom['ui:options'].hint}</span>;
+  // the uiSchema is typed by the widget's value, which says nothing about the `custom` entry read from it
+  const ui = uiSchema as UiSchema<{ custom?: string }> | undefined;
+  const hint = ui?.custom?.['ui:options']?.hint;
+  return <span>{typeof hint === 'string' ? hint : null}</span>;
 }
```

A child read by a key known only at runtime, as a custom object field reads one by its property name, has no data type to annotate with. Cast the entry, or read it with `getByPath<UiSchema | undefined>()`, as `ObjectField` does:

```diff
 function MyObjectField({ uiSchema, name }: FieldProps) {
-  const options = getUiOptions(uiSchema?.[name]);
+  // `name` is known only at runtime, so nothing types the entry under it
+  const options = getUiOptions(uiSchema?.[name] as UiSchema | undefined);
   return <span>{options.title}</span>;
 }
```

For a spread, annotate the uiSchema the entry comes from with the data it describes:

```diff
-const base: UiSchema = { field: { 'ui:widget': 'textarea' } };
+const base: UiSchema<{ field?: string }> = { field: { 'ui:widget': 'textarea' } };
 const uiSchema = { field: { ...base.field, 'ui:help': 'Shown below' } };
```

An entry read from a `UiSchema<Record<string, unknown>>` is `unknown`, so check it with `isObject()` before reading its keys.

In a `UiSchema` with no type argument, or whose `T` has no index signature, `additionalProperties` describes data of an unknown type, so a function written inside it, such as an `items` function or an inline `ui:field`, gets `unknown` for that data. Annotate its parameter:

```diff
 const uiSchema: UiSchema = {
   additionalProperties: {
-    items: (item) => ({ 'ui:title': item.label }),
+    items: (item: { label: string }) => ({ 'ui:title': item.label }),
   },
 };
```

Spreading the rest of a generic `UiSchema<T, S, F>` into a new object no longer gives back a `UiSchema<T, S, F>`, since the checker can't relate that rest to the type it came from. Cast the rest, which leaves the keys beside it checked:

```diff
 const { 'ui:title': _title, ...rest } = uiSchema;
-return { ...rest, 'ui:options': {} };
+return { ...(rest as UiSchema<T, S, F>), 'ui:options': {} };
```

## Verify

- The type checker accepts your reads, spreads and functions.
- Nothing changes at runtime, so the uiSchema applies as before.
- Options read from `ui:options` that `UIOptionsType` doesn't declare are `unknown` as well; see [A ui option RJSF does not declare reads as unknown](./undeclared-ui-options-are-unknown.md).
