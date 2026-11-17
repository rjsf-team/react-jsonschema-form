---
title: 'An IChangeEvent or FormRef you build yourself needs the form status members'
description: '`IChangeEvent` has five new required members (`dirty`, `dirtyFields`, `touched`, `touchedFields`, `submitCount`) and `FormRef` a required `getStatus()`. Add them to any event or ref stand-in you build by hand.'
packages: ['@rjsf/core']
uses: [typescript, form-ref]
schema: []
kind: type
noticed: type-error
related: [change-event-members-are-readonly]
---

## Detect

- In your code or tests: an object typed `IChangeEvent` that you build yourself, such as in a wrapper component that calls an `onChange` prop or in a test fixture.
- In your tests: a stand-in for a `FormRef`, such as a test double for the ref handle.
- In the type checker: `TS2739: Type '…' is missing the following properties from type 'IChangeEvent<…>': dirty, dirtyFields, touched, touchedFields, submitCount`, or `TS2741: Property 'getStatus' is missing in type '…' but required in type 'FormRef<…>'.`

## Change

The event now carries the form's status (see [Unsaved changes](../../usage/submitting.md#unsaved-changes) and [Touched fields](../../usage/submitting.md#touched-fields)), and `FormRef.getStatus()` returns the same five members. Code that only reads events or calls the handle is unaffected. Add the members to an object you build:

```diff
-const event: IChangeEvent<MyData> = { ...rest };
+const event: IChangeEvent<MyData> = {
+  ...rest,
+  dirty: false,
+  dirtyFields: {},
+  touched: false,
+  touchedFields: {},
+  submitCount: 0,
+};
```

A `FormRef` stand-in needs a `getStatus()` method that returns `{ dirty, dirtyFields, touched, touchedFields, submitCount }`.

## Verify

- Your fixtures and wrappers compile.
- Code that reads the new members from a hand-built event gets the values you set.
