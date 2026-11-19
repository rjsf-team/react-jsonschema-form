---
title: A custom ObjectFieldTemplate calls registry.schemaUtils.canExpand
description: '`@rjsf/utils` no longer exports `canExpand()`, since whether an object takes extra keys now depends on the form''s `SchemaContext`. Call `registry.schemaUtils.canExpand(schema, uiSchema, formData)` in your `ObjectFieldTemplate` instead.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-templates, utils-api]
schema: []
affects: [code]
related: [schema-utils-type-gains-can-expand, utils-exports-only-what-rjsf-packages-use]
---

## Detect

- Your custom `ObjectFieldTemplate` imports `canExpand` from `@rjsf/utils` to decide whether to show its Add button.
- The type checker reports `Module '"@rjsf/utils"' has no exported member 'canExpand'.`

## Change

Whether an object naming no `additionalProperties` takes extra keys is now a form setting, `additionalPropertiesWhenAbsent`, which travels in the `SchemaContext` ([#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137)). Every theme's `ObjectFieldTemplate` now calls `registry.schemaUtils.canExpand()`, which passes the form's own `SchemaContext`, and `@rjsf/utils` no longer exports `canExpand()` itself (see [@rjsf/utils no longer exports utilities no other RJSF package uses](./utils-exports-only-what-rjsf-packages-use.md)).

Do the same in your template:

```diff
-import { canExpand } from '@rjsf/utils';
-{canExpand(schema, uiSchema, formData) && <AddButton onClick={onAddProperty} />}
+{registry.schemaUtils.canExpand(schema, uiSchema, formData) && <AddButton onClick={onAddProperty} />}
```

## Verify

- Your template compiles and shows the Add button on the same objects the built-in themes do.
- If you implement `SchemaUtilsType` yourself, it needs the new methods; see [SchemaUtilsType gains canExpand and allowsAdditionalProperties](./schema-utils-type-gains-can-expand.md).
