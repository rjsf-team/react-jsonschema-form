---
title: A custom field building antd ObjectFieldTemplate properties sets renderedAs
description: antd's `ObjectFieldTemplate` now keys a property's `colSpan` by its `renderedAs`, so a property built without it gets the default span. A custom field that builds the `properties` itself sets `renderedAs` with `createSchemaFieldRenderedAs()` from `@rjsf/core`.
packages: ['@rjsf/antd']
uses: [custom-fields]
schema: []
affects: [code, appearance]
related: [antd-col-span-keyed-by-rendered-widget]
---

## Detect

- In your code: a custom field that builds the `properties` array it hands `@rjsf/antd`'s `ObjectFieldTemplate`, with `content`, `name` and `hidden` but no `renderedAs`.
- On the rendered page: those properties ignore your `formContext.colSpan` entries.

## Change

Set each property's `renderedAs` with `createSchemaFieldRenderedAs()`, handing it what you hand the property's `SchemaField`:

```diff
+import { createSchemaFieldRenderedAs } from '@rjsf/core';
+
   return {
     content: <SchemaField name={name} schema={propertySchema} uiSchema={propertyUiSchema} formData={propertyData} fieldPath={propertyPath} {...rest} />,
     name,
     hidden,
+    renderedAs: () => createSchemaFieldRenderedAs()(propertySchema, propertyUiSchema, propertyData, propertyPath, registry),
   };
```

See [`renderedAs`](../../advanced-customization/custom-templates.md#objectfieldtemplate) for keeping one per property across renders.

## Verify

- Your properties take the span of their `colSpan` entry.
