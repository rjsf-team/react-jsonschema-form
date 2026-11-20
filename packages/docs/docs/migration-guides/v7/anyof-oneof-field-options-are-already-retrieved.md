---
title: 'AnyOfField and OneOfField expect their options already retrieved'
description: '`AnyOfField` and `OneOfField` used to retrieve their `options` schemas a second time; `SchemaField` now retrieves them and the fields don''t. A custom field passing raw option schemas retrieves each one first.'
packages: ['@rjsf/core']
uses: [custom-fields]
schema: [any-of-one-of]
affects: [code]
related: [custom-layout-multi-schema-field-renders-only-the-selector]
---

## Detect

- In your custom field: `AnyOfField` or `OneOfField` rendered with raw option schemas, such as `<AnyOfField {...props} options={schema.anyOf} />`.

## Change

`SchemaField` retrieves each `anyOf`/`oneOf` option for the field's data and hands the retrieved schemas to `AnyOfField`/`OneOfField` as `options`. Retrieve them first. An option may be a boolean schema, which `SchemaField` retrieves as an empty one:

```diff
-return <AnyOfField {...props} options={schema.anyOf} />;
+const options = (schema.anyOf ?? []).map((option) =>
+  registry.schemaUtils.retrieveSchema(typeof option === 'object' ? option : {}, formData),
+);
+return <AnyOfField {...props} options={options} />;
```

A custom field that passes on the `options` prop it received from `SchemaField` is unaffected.

## Verify

- The field lists resolved options and selects the one matching its data.
