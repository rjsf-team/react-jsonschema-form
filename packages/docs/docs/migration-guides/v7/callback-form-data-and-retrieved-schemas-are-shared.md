---
title: 'Received form data and retrieved schemas are shared and must not be mutated'
description: 'The `formData` a `Form` callback hands you now shares unchanged subtrees with earlier values, and `retrieveSchema()` may return the same schema instance across calls. Copy before changing either.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-props, utils-api]
schema: []
kind: runtime
noticed: review
related: [form-data-is-frozen-in-development, root-schema-changed-in-place-is-not-reread, change-event-members-are-readonly]
---

## Detect

- In your code: a schema returned by `retrieveSchema()` or `schemaUtils.retrieveSchema()` that you change in place, such as by assigning to its `properties`.
- In your `onChange`, `onBlur` or `onSubmit` handlers: in-place writes into the received `formData`.

## Change

The `formData` you receive from `onChange`, `onBlur`, `onSubmit` and the other callbacks shares unchanged subtrees with the previous value, the `formData` you passed included, so mutating it in place corrupts your own state. Treat it as immutable; [Form data is deep-frozen in development](./form-data-is-frozen-in-development.md) covers what to change.

Schemas returned by `retrieveSchema()` are shared the same way: it may return the same instance across calls. Copy one before changing it:

```diff
 const retrieved = schemaUtils.retrieveSchema(schema, formData);
-retrieved.title = 'Address';
+const titled = { ...retrieved, title: 'Address' };
```

The root schema is treated as immutable too; see [A root schema changed in place is not read again](./root-schema-changed-in-place-is-not-reread.md).

## Verify

- A schema you change is a copy, and later `retrieveSchema()` calls return the unchanged schema.
