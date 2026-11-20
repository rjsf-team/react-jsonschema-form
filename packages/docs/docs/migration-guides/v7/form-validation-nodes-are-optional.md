---
title: Every node of FormValidation and ErrorSchema is optional
description: 'Every node of a typed `FormValidation<T>` or `ErrorSchema<T>` is now optional, since the tree only holds the fields that have errors. Reach into nodes with `?.`, such as `errors.address?.city?.addError(...)`.'
packages: ['@rjsf/utils']
uses: [typescript, form-props]
schema: []
affects: [code]
related: [typed-error-schema-matches-the-error-tree]
---

## Detect

- In your `customValidate` function or other TypeScript code: a typed `FormValidation<T>` or `ErrorSchema<T>` node reached with `.`, such as `errors.address.city.addError(...)`.
- In the type checker: `TS18048: 'errors.address' is possibly 'undefined'.` on that line.

## Change

`ErrorSchema<T>` and `FormValidation<T>` now describe the tree RJSF builds (see [A typed ErrorSchema matches the tree RJSF builds](./typed-error-schema-matches-the-error-tree.md)). That tree only contains the fields that actually have errors, so every node is optional. `FormValidation<T>`, the tree a `customValidate` function receives, is the same tree with `addError()` on every node.

Reach into nodes with `?.`:

```diff
-errors.address.city.addError('unknown city');
+errors.address?.city?.addError('unknown city');
```

## Verify

Your `customValidate` function type-checks, and the errors it adds still show on the fields they target.
