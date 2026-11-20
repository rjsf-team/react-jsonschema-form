---
title: The experimental_ and Experimental_ prefixes are dropped
description: 'The `experimental_defaultFormStateBehavior` and `experimental_customMergeAllOf` props and three `Experimental_` types from `@rjsf/utils` lost their prefix. Rename them in your props, imports and schema function calls.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-props, typescript, utils-api]
schema: []
affects: [code]
related: [schema-functions-take-schema-context]
---

## Detect

- In your code: `experimental_defaultFormStateBehavior` or `experimental_customMergeAllOf` passed to a `Form`. The type checker reports `TS2322` with `Property 'experimental_defaultFormStateBehavior' does not exist on type 'IntrinsicAttributes & FormProps<…>'`.
- In your imports: `Experimental_DefaultFormStateBehavior`, `Experimental_ArrayMinItems` or `Experimental_CustomMergeAllOf` from `@rjsf/utils`. The type checker reports `TS2305: Module '"@rjsf/utils"' has no exported member 'Experimental_DefaultFormStateBehavior'`.
- In your calls to `@rjsf/utils` schema functions such as `getDefaultFormState`, `retrieveSchema` or `createSchemaUtils`: an `experimental_defaultFormStateBehavior` or `experimental_customMergeAllOf` argument.

## Change

These features are no longer experimental, and the prefix has been dropped from their names:

| Old name                                                      | New name                             |
| ------------------------------------------------------------- | ------------------------------------ |
| `FormProps.experimental_defaultFormStateBehavior`             | `FormProps.defaultFormStateBehavior` |
| `FormProps.experimental_customMergeAllOf`                     | `FormProps.customMergeAllOf`         |
| `Experimental_DefaultFormStateBehavior` (type, `@rjsf/utils`) | `DefaultFormStateBehavior`           |
| `Experimental_ArrayMinItems` (type, `@rjsf/utils`)            | `ArrayMinItems`                      |
| `Experimental_CustomMergeAllOf` (type, `@rjsf/utils`)         | `CustomMergeAllOf`                   |

```diff
-import type { Experimental_DefaultFormStateBehavior } from '@rjsf/utils';
+import type { DefaultFormStateBehavior } from '@rjsf/utils';

 <Form
   schema={schema}
   validator={validator}
-  experimental_defaultFormStateBehavior={behavior}
-  experimental_customMergeAllOf={mergeAllOf}
+  defaultFormStateBehavior={behavior}
+  customMergeAllOf={mergeAllOf}
 />
```

The matching parameters of the `@rjsf/utils` schema functions were renamed the same way and are now members of the `SchemaContext` those functions take; see [@rjsf/utils schema functions take a SchemaContext in place of the validator](./schema-functions-take-schema-context.md).

## Verify

Your code type-checks with no `experimental_` or `Experimental_` names left, and the form fills defaults and merges `allOf` as it did before.
