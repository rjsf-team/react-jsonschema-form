---
title: IChangeEvent and FormState no longer carry fieldPathId
description: The event your `onChange`, `onSubmit` or `onError` handler gets, and `FormState`, no longer have a `fieldPathId`. Use the `idPrefix` you pass to `Form` as the root id, and read `schemaUtils`, `formData` and `errorSchema` as before.
packages: ['@rjsf/core']
uses: [form-props]
schema: []
kind: removal
noticed: type-error
related: [fieldpathid-prop-is-fieldpath-and-id]
---

## Detect

- In your handlers: `e.fieldPathId`, or `fieldPathId` destructured from an `IChangeEvent` or a `FormState`.
- The type checker reports `TS2339: Property 'fieldPathId' does not exist on type 'IChangeEvent<…>'`. In JavaScript the value is `undefined`.

## Change

Derive what you used `fieldPathId` for some other way. The root form's DOM id is the `idPrefix` you pass to `Form` (`root` by default), and `e.schemaUtils`, `e.formData` and `e.errorSchema` are unchanged.

```diff
-const onSubmit = (e: IChangeEvent<MyData>) => focus(e.fieldPathId.$id);
+const onSubmit = (e: IChangeEvent<MyData>) => focus(idPrefix);
```

Fields and templates lost the prop too. See [Fields and templates receive fieldPath and id instead of a fieldPathId object](./fieldpathid-prop-is-fieldpath-and-id.md).

## Verify

- The type checker reports no `fieldPathId` error on the event or state.
- The handler gets the root id it expects.
