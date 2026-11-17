---
title: getDefaultFormState() takes a SchemaContext and a props object
description: "`getDefaultFormState()` took a validator and a long list of positional parameters. It now takes a `SchemaContext` and a `GetDefaultFormStateProps` object; move each argument into the matching prop."
packages: ['@rjsf/utils']
uses: [utils-api]
schema: []
kind: removal
noticed: type-error
related: [schema-functions-take-schema-context]
---

## Detect

- In your code, a call to `getDefaultFormState()` imported from `@rjsf/utils` with positional arguments after the `validator`.
- The type checker reports `Expected 2 arguments, but got 5.` (TS2554, with your argument count) on the call.

## Change

`getDefaultFormState()` had the longest list of optional parameters, most of them easy to pass in the wrong order. It now takes a [`SchemaContext`](./schema-functions-take-schema-context.md) followed by a `GetDefaultFormStateProps` object:

```diff
-getDefaultFormState(validator, schema, formData, rootSchema, false, defaultFormStateBehavior, customMergeAllOf, undefined, uiSchema);
+getDefaultFormState({ validator, customMergeAllOf, defaultFormStateBehavior }, { schema, formData, rootSchema, uiSchema });
```

Its props are `schema`, `formData?`, `rootSchema?`, `includeUndefinedValues?`, `initialDefaultsGenerated?`, `uiSchema?` and `uiSchemaDefinitions?`, with the same meanings and defaults the positional parameters had.

`SchemaUtilsType.getDefaultFormState()` is unchanged.

## Verify

The type checker accepts the call, and it returns the same defaults as before.
