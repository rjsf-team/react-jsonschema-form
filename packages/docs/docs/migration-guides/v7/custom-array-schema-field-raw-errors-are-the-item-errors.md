---
title: 'A custom ArraySchemaField gets each item own errors as rawErrors'
description: '`ArrayField` used to hand each item''s field the array''s errors as `rawErrors`; it now hands the item''s own. Draw the array''s errors in `ArrayFieldTemplate`, and don''t draw `rawErrors` beside a `SchemaField` that already draws them.'
packages: ['@rjsf/core']
uses: [custom-fields]
schema: [arrays]
affects: [code, experience]
related: [array-field-no-longer-passes-error-schema-on-item-moves]
---

## Detect

- In your `fields`: a custom `ArraySchemaField` that reads the deprecated `rawErrors`.
- On the rendered page: array-level errors no longer show next to each item, or an item's errors show twice.

Nothing warns about the change.

## Change

`ArrayField` hands the field it renders for each item, a custom `ArraySchemaField` or `SchemaField`, the item's own errors as `rawErrors`, where it used to hand every item the array's errors.

- One that drew `rawErrors` next to each item as the array's errors now draws that item's own there. Draw the array's errors in the `ArrayFieldTemplate`, which is handed them.
- One that drew `rawErrors` and also hands its `errorSchema` to a `SchemaField`, which draws the `__errors` it holds, now draws the item's errors twice. Draw only one of them:

```diff
 const CustomArraySchemaField = (props: FieldProps) => {
-  const { rawErrors, registry } = props;
-  const { SchemaField } = registry.fields;
-  return (
-    <>
-      <SchemaField {...props} />
-      {rawErrors?.map((error) => <p key={error}>{error}</p>)}
-    </>
-  );
+  const { SchemaField } = props.registry.fields;
+  return <SchemaField {...props} />;
 };
```

## Verify

- Each item shows its own errors once, and the array's errors show where your `ArrayFieldTemplate` draws them.
