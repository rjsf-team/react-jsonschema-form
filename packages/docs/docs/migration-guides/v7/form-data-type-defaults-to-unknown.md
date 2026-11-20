---
title: Form data defaults to unknown and form context to FormContextType instead of any
description: The form-data generic `T` now defaults to `unknown` and the form-context generic `F` to `FormContextType` instead of `any`. Pass your data type as the type argument, or narrow the value before reading it.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [typescript]
schema: []
affects: [code]
related:
  [
    form-context-type-is-object,
    bare-ui-schema-rejects-record-data,
    form-ref-needs-form-data-type,
    bare-formprops-rejects-typed-handlers,
    change-event-form-data-undefined-for-scalar-root,
    validator-type-takes-schema-type-first,
    with-theme-returns-a-themed-form,
  ]
---

## Detect

- The type checker reports `'formData' is of type 'unknown'.` (TS18046) where your code reads `formData` from an `IChangeEvent`, `FieldProps`, `WidgetProps`, a template's props or a `customValidate` callback written without a type argument.
- In your code: `IChangeEvent`, `FieldProps`, `WidgetProps`, `CustomValidator` or a `*TemplateProps` type used bare, with code that reads into the data.
- In your code: `SchemaUtilsType<T, S>` with two type arguments, written out by hand for a `Registry`'s `schemaUtils`.

## Change

The RJSF generics are `<T, S, F>`: the form data, the schema and the form context. `T` and `F` used to default to `any`, so anything read out of `formData` was unchecked however far it travelled. They now default to `unknown` and `FormContextType`. `FormContextType` is `object`, so reading a key of an untyped `formContext` is a type error too; see [FormContextType is object, so formContext keys must be named](./form-context-type-is-object.md).

The form data now arrives as `unknown`, so name its type or narrow it. Naming the type is preferred:

```diff
-const onChange = ({ formData }: IChangeEvent) => save(formData.name);
+const onChange = ({ formData }: IChangeEvent<MyData>) => save(formData.name);
```

Narrow it when the data really is unknown at that point:

```diff
-function MyField({ formData }: FieldProps) {
-  return <input value={formData} />;
+function MyField({ formData }: FieldProps) {
+  return <input value={typeof formData === 'string' ? formData : ''} />;
 }
```

A custom validator receives `unknown` for the same reason:

```diff
-const customValidate = ({ pass1, pass2 }, errors) => {
+const customValidate: CustomValidator<MyData> = (formData, errors) => {
+  const { pass1, pass2 } = formData ?? {};
   if (pass1 !== pass2) {
     errors.pass2?.addError("Passwords don't match");
   }
   return errors;
 };
```

`Registry.schemaUtils` is now `SchemaUtilsType<T, S, F>` rather than `SchemaUtilsType<T, S>`. If you wrote that type out by hand, add the third argument:

```diff
-const schemaUtils: SchemaUtilsType<MyData, RJSFSchema> = registry.schemaUtils;
+const schemaUtils: SchemaUtilsType<MyData, RJSFSchema, MyFormContext> = registry.schemaUtils;
```

## Verify

The type checker reports no `is of type 'unknown'` error on form data. Nothing changes at runtime. These keep working without a change:

- `Form<MyData>`, `FieldProps<MyData>` and `IChangeEvent<MyData>` behave as before, apart from `IChangeEvent.formData`; see [IChangeEvent.formData and getFormData() include undefined for a scalar root](./change-event-form-data-undefined-for-scalar-root.md).
- `Form` infers `T` from `formData` or `initialFormData` when you pass it, so `<Form formData={data} onChange={…} />` types the handler with no type argument. With no data passed, `T` comes from the other props, so a typed `onSubmit` still types the form.
- Values annotated without a type argument still fit a typed form and don't change what it infers: a `const uiSchema: UiSchema = …`, a `CustomValidator` or `ErrorTransformer`, a handler taking a bare `IChangeEvent`, and a widget, field or template written against the bare props (`function MyWidget(props: WidgetProps)`, class components included). Component slots check their props bivariantly, the way React checks event handlers.
- The exception is a bare `UiSchema` for data with a narrow string index signature such as `Record<string, string>`; see [A bare UiSchema no longer fits a form whose data has a narrow index signature](./bare-ui-schema-rejects-record-data.md).
- The validators and the theme exports were retyped to keep working with a typed form; see [ValidatorType and customizeValidator() take the schema as their first type argument](./validator-type-takes-schema-type-first.md) and [withTheme() returns a ThemedForm](./with-theme-returns-a-themed-form.md).
- A ref needs its own type argument; see [A bare FormRef types the form data as unknown](./form-ref-needs-form-data-type.md). A typed handler doesn't fit a bare `FormProps`; see [A typed handler no longer fits a bare FormProps](./bare-formprops-rejects-typed-handlers.md).
