---
title: UiSchemaDefinitions drops its form data type parameter
description: "`UiSchemaDefinitions` no longer takes the form data type and types every entry as `UiSchema<unknown, S, F>`. Drop the form data argument from every `UiSchemaDefinitions<...>` you write."
packages: ['@rjsf/utils']
uses: [typescript, ui-schema]
schema: [refs]
affects: [code]
related: []
---

## Detect

- Your TypeScript code writes `UiSchemaDefinitions<...>` with a form data type as its first argument.
- A three-argument `UiSchemaDefinitions<MyFormData, RJSFSchema, MyContext>` fails with `TS2707: Generic type 'UiSchemaDefinitions' requires between 0 and 2 type arguments`.
- A one- or two-argument `UiSchemaDefinitions<MyFormData>` or `UiSchemaDefinitions<MyFormData, RJSFSchema>` binds `MyFormData` to the schema type `S`. It may compile, or fail with `TS2559: Type 'MyFormData' has no properties in common with type 'JSONSchema7'`, which doesn't mention the dropped parameter.

## Change

`UiSchemaDefinitions<S, F>` types every entry as `UiSchema<unknown, S, F>`, and `UiSchema`'s own `ui:definitions` key uses the same type. A definition applies to whichever field references it, so typing it by the root form's data rejected the nested keys of the field it describes. Drop the form data argument in every case:

```diff
-const definitions: UiSchemaDefinitions<MyFormData, RJSFSchema, MyContext> = { ... };
+const definitions: UiSchemaDefinitions<RJSFSchema, MyContext> = { ... };
```

## Verify

- The definitions compile, and their entries accept the keys of the fields that reference them.
