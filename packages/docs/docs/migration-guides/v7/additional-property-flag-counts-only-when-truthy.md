---
title: ADDITIONAL_PROPERTY_FLAG counts only when set to a truthy value
description: "A schema with `ADDITIONAL_PROPERTY_FLAG` set to `false` or `undefined` used to draw a key input and remove button, and now renders as a plain declared field. Leave the flag out unless the field is an additional property, and read it with `hasSchemaMarker()`."
packages: ['@rjsf/core']
uses: [custom-fields, custom-templates, utils-api]
schema: [additional-properties]
affects: [appearance, code, experience]
related: [rjsf-marked-schema-has-no-index-signature]
---

## Detect

- Your code sets `ADDITIONAL_PROPERTY_FLAG` to `false` or `undefined` on a schema, such as `{ ...schema, [ADDITIONAL_PROPERTY_FLAG]: false }`.
- Your custom template tests `ADDITIONAL_PROPERTY_FLAG in schema`.
- On the rendered page, a field that used to show a key input and remove button no longer does, or is labelled by its `title` where it used to show its key.

## Change

In 6.x, `WrapIfAdditionalTemplate`, in `@rjsf/core` and every theme, and the label `SchemaField` picked read `ADDITIONAL_PROPERTY_FLAG` by its presence, while the rest of RJSF read it by its value. A schema with the flag set to `undefined` or `false` drew a key input and remove button and was labelled by its key, but was otherwise a declared property. Those reads now take the flag's value too, so such a field renders as a plain declared field, with no key input or remove button, labelled by its `title` where it has one.

Setting the flag to `true` brings the key input back, but makes the field an additional property everywhere else as well. Set it to `true` only for a field that is an additional property; otherwise leave it out:

```diff
-const extra = { ...schema, [ADDITIONAL_PROPERTY_FLAG]: false };
+const extra = schema;
```

A custom template that tests `ADDITIONAL_PROPERTY_FLAG in schema` still draws a key input and remove button for a field whose flag is falsy, unlike the templates RJSF ships. Read the flag with [`hasSchemaMarker()`](../../api-reference/utility-functions.md#hasschemamarker) to match them:

```diff
-const additional = ADDITIONAL_PROPERTY_FLAG in schema;
+const additional = hasSchemaMarker(schema, ADDITIONAL_PROPERTY_FLAG);
```

## Verify

- A field without the flag renders with no key input or remove button and takes its label from `title`.
- If you set the flag to `true`, check the side effects. The field's uiSchema is read from `uiSchema.additionalProperties` instead of `uiSchema[key]`. Under `constAsDefaults: 'always'`, the computed defaults drop it where the object's `const` doesn't name its key. `omitExtraData` drops it, and `getDisplayLabel()` gives an object or array field a label.
- Your custom template shows a key input only for fields whose flag is truthy. On TypeScript, see [RJSFMarkedSchema has no index signature](./rjsf-marked-schema-has-no-index-signature.md) for typed marker reads.
