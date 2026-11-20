---
title: ObjectField renders the schema it is handed without retrieving it again
description: '`ObjectField` used to retrieve its schema again for the data, and now renders the schema it is handed as it stands. A custom field that hands it a schema it didn''t get from `SchemaField` retrieves it first with `registry.schemaUtils.retrieveSchema()`.'
packages: ['@rjsf/core']
uses: [custom-fields]
schema: [refs, defaults, additional-properties]
affects: [code]
---

## Detect

- In your code: a custom field that renders `registry.fields.ObjectField` (or an imported `ObjectField`) with a `schema` other than the one it received, such as a definition looked up in the root schema.
- On the rendered page: properties that a `$ref`, `allOf` or `if`/`then`/`else` brings in, or extra keys of the data, render no field.

## Change

`SchemaField` hands `ObjectField` the schema already retrieved, its extra keys stubbed with the selected option, so `ObjectField` no longer retrieves it again. Retrieve the schema yourself before you hand it over:

```diff
-<ObjectField {...props} schema={schema} />
+<ObjectField {...props} schema={registry.schemaUtils.retrieveSchema(schema, formData)} />
```

A custom field that passes on the `schema` prop it received is unaffected.

## Verify

- The properties from the definition's `$ref`, `allOf` and conditions render.
- Extra keys of the data render as rows.
