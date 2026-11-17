---
title: ObjectFieldTemplatePropertyType is generic and types its content
description: "`ObjectFieldTemplatePropertyType` is now generic over `<T, S, F>` and types `content` as `ReactElement<Pick<FieldProps<T, S, F>, 'schema' | 'uiSchema'>>`. Fix explicit type arguments and any code that read `content.props` as `any`."
packages: ['@rjsf/utils']
uses: [typescript, custom-templates]
schema: []
kind: type
noticed: type-error
related: []
---

## Detect

- Your TypeScript code writes `ObjectFieldTemplatePropertyType` with explicit, non-default type arguments.
- Your `ObjectFieldTemplate` reads `content.props` of a property as `any`, and the type checker now reports any other prop, for example `error TS2339: Property 'onChange' does not exist on type 'Pick<FieldProps<…>, "schema" | "uiSchema">'.`

## Change

`ObjectFieldTemplatePropertyType` in `@rjsf/utils` is now generic (`<T, S, F>`, defaulted like every other RJSF generic type), and its `content` field is typed as `ReactElement<Pick<FieldProps<T, S, F>, 'schema' | 'uiSchema'>>` instead of a bare `ReactElement`. `ObjectFieldTemplateProps['properties']` threads its own `<T, S, F>` through to it.

```diff
-const property: ObjectFieldTemplatePropertyType = props.properties[0];
-const schema = property.content.props.schema as MySchema;
+const property: ObjectFieldTemplatePropertyType<MyData, MySchema> = props.properties[0];
+const schema = property.content.props.schema;
```

## Verify

- Your template compiles, reading only `schema` and `uiSchema` from `content.props`.
