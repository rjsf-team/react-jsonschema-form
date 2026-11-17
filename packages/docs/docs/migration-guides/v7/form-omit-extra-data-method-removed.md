---
title: The Form omitExtraData() instance method is removed
description: "The deprecated `Form.omitExtraData()` instance method has been removed. Call `SchemaUtils.omitExtraData(schema, formData)` instead, from `createSchemaUtils` or the `registry.schemaUtils` your components receive."
packages: ['@rjsf/core']
uses: [form-ref]
schema: []
kind: removal
noticed: type-error
related: [omit-extra-data-submit-keeps-the-omitted-data]
---

## Detect

- Your code calls `omitExtraData()` on a ref to `Form`; the type checker reports it as missing on `FormRef`.

## Change

The `Form.omitExtraData()` instance method, deprecated in a prior release, has been removed. Use `SchemaUtils.omitExtraData(schema, formData)` instead. Build one with `createSchemaUtils`, or use the `registry.schemaUtils` your fields, widgets and templates already receive:

```diff
-const trimmed = formRef.current.omitExtraData(formData);
+const schemaUtils = createSchemaUtils(validator, schema);
+const trimmed = schemaUtils.omitExtraData(schema, formData);
```

## Verify

- The trimmed data matches what the method used to return.
