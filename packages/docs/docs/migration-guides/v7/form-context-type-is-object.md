---
title: FormContextType is object, so formContext keys must be named
description: '`FormContextType`, the constraint and default of every `F`, was `Record<string, any>` and is now `object`. Name the keys you read as optional, or take your context type as `F`.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [typescript, custom-fields, custom-widgets, custom-templates, ui-schema]
schema: []
affects: [code]
related: [form-data-type-defaults-to-unknown]
---

## Detect

- In your code: a component that reads a key of `formContext` or `registry.formContext` without naming the context type.
- In your uiSchema: a dynamic `items` callback that reads a key of its `formContext` argument.
- The type checker reports `Property 'locale' does not exist on type '{}'.` (TS2339) on that read.

## Change

`FormContextType` is `object`, so any object, an `interface` included, can be a form context. A component generic over the context, or left on the default `object`, names the keys it reads, each optional, since `object` promises none:

```diff
-const { locale } = registry.formContext;
+const { locale }: { locale?: string } = registry.formContext;
```

A dynamic `uiSchema.items` callback gets the context as `F` too, so one that reads a key passes its context type to `UiSchema`:

```diff
-const uiSchema: UiSchema = {
+const uiSchema: UiSchema<unknown, RJSFSchema, { isAdmin?: boolean }> = {
   items: (_itemData, _index, formContext) => (formContext?.isAdmin ? adminItem : userItem),
 };
```

A key computed at runtime, such as a field's `id`, is read from a member typed as a record:

```diff
-const label = registry.formContext.labels[id];
+const { labels = {} }: { labels?: Record<string, string> } = registry.formContext;
+const label = labels[id];
```

A context that is itself keyed that way can't be annotated as a record, since `object` isn't assignable to one; the component takes it as `F`:

```diff
-function IdField({ id, registry }: FieldProps) {
+function IdField({ id, registry }: FieldProps<unknown, RJSFSchema, Record<string, string>>) {
   const label = registry.formContext[id];
```

A component that knows the context type takes it as `F`, as in `FieldProps<MyData, RJSFSchema, MyContext>`, and reads its keys directly. The annotations above compile only for a context that is generic or the default `object`; on a known context they fail unless the two types share a key.

Under `@rjsf/antd`, a component generic over the context, or on the default, can annotate with the exported `AntdFormContext` to read the theme's options, whose `rowGutter` is what antd's `Row` takes. A known context extends it, as in `interface MyContext extends AntdFormContext`, and its keys are read directly.

The defaults of the other generics changed too, see [Form data defaults to unknown](./form-data-type-defaults-to-unknown.md).

## Verify

- The type checker accepts every read of a context key.
- Nothing changes at runtime: `formContext` holds the same object you pass to `Form`.
