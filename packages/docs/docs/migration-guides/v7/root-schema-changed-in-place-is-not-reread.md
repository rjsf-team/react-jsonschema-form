---
title: A root schema changed in place is not read again
description: 'Each root schema object is now parsed once and cached, so a change made to it in place is no longer seen. Pass a new schema object to change the schema, and never mutate a schema you have handed to a schema utility.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, custom-fields, utils-api]
schema: []
affects: [code]
related: []
---

## Detect

- In your code: assignments into the object you pass as `schema`, such as `schema.properties.color.enum = …`, a `push` onto its arrays or a `delete` of its keys, followed by a re-render or a new `createSchemaUtils()`.
- In a custom field or your own code: a schema built and then changed after being handed to `retrieveSchema()`, `getDefaultFormState()`, `isSelect()` or `getClosestMatchingOption()`.
- In a custom field: a schema built from form data and handed to a schema utility.
- On the rendered page: the form keeps showing the schema as it stood when first rendered.

## Change

The schema graph is parsed once per root schema object and kept while that object lives, and the plans and resolved schemas are kept against it. A change made to the root schema in place is therefore not seen, not even by a new `createSchemaUtils()` or by `Form` rendering it again. Before, the next `retrieveSchema()` read the schema as it then stood. To change a schema, pass a new object, as you would for any other React prop:

```ts
const schema = { type: 'object', properties: { color: { type: 'string', enum: ['red'] } } };
createSchemaUtils({ validator }, schema).retrieveSchema(schema);
schema.properties.color.enum = ['red', 'green'];
createSchemaUtils({ validator }, schema).retrieveSchema(schema).properties.color.enum;
// Before: ['red', 'green']
// After: ['red'], since `schema` is the object already parsed

const changed = { ...schema, properties: { color: { type: 'string', enum: ['red', 'green'] } } };
createSchemaUtils({ validator }, changed).retrieveSchema(changed).properties.color.enum;
// Before and after: ['red', 'green']
```

```diff
-schema.properties.color.enum.push('green');
-setSchema(schema);
+setSchema({
+  ...schema,
+  properties: { ...schema.properties, color: { ...schema.properties.color, enum: [...schema.properties.color.enum, 'green'] } },
+});
```

A schema you hand `retrieveSchema()` that the root does not hold, such as one a custom field builds from scratch, is parsed once per content and kept for as long as the root, and so is one you hand any other schema utility that resolves it, such as `getDefaultFormState()`, `isSelect()` or `getClosestMatchingOption()`. Calls handed the same content share its result, so do not change such a schema once handed in either. Build it from the schema and leave form data out of it: one built from form data keeps an entry for each distinct value until the root changes.

## Verify

- After you replace the schema object, the form renders the new schema.
- Memory stays flat while the user edits a form whose custom field builds schemas.
