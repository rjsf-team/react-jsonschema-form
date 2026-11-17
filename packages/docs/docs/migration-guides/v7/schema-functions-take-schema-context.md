---
title: "@rjsf/utils schema functions take a SchemaContext in place of the validator"
description: "Schema functions such as `retrieveSchema()` and `createSchemaUtils()` took a `validator` plus separate `customMergeAllOf` and `defaultFormStateBehavior`. They now take one `SchemaContext` holding all three; build it and drop the separate arguments."
packages: ['@rjsf/utils', '@rjsf/core']
uses: [utils-api, form-props]
schema: []
kind: removal
noticed: type-error
related: [get-default-form-state-takes-a-props-object, schema-utils-type-adds-constrains-alike-and-get-filled-default, custom-merge-all-of-applies-in-every-schema-function, utils-default-state-internals-not-exported]
---

## Detect

- In your code, a call to an `@rjsf/utils` schema function that passes a `validator` first: `findFieldInSchema()`, `findSelectedOptionInXxxOf()`, `getClosestMatchingOption()`, `getDisplayLabel()`, `getFirstMatchingOption()`, `getFromSchema()`, `isFilesArray()`, `isMultiSelect()`, `isSelect()`, `omitExtraData()`, `retrieveSchema()` or `sanitizeDataForNewSchema()`.
- A call to `createSchemaUtils()` or `doesSchemaUtilsDiffer()`.
- A `computeSkipPopulate` callback in `defaultFormStateBehavior.arrayMinItems` that uses its first argument as a validator.
- The type checker reports `Property 'validator' is missing in type 'ValidatorType<…>' but required in type 'SchemaContext<…>'.` (TS2741) on the first argument of each such call.

## Change

The `validator`, the form's `customMergeAllOf` and its `defaultFormStateBehavior` now travel together in a `SchemaContext`:

```ts
interface SchemaContext<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType> {
  readonly validator: ValidatorType<S, F>;
  readonly customMergeAllOf?: CustomMergeAllOf<S>;
  readonly defaultFormStateBehavior?: DefaultFormStateBehavior;
}
```

Every function that took a `validator` takes a `SchemaContext` in its place, and passes it along whole to every schema function it calls. The separate `customMergeAllOf` and `defaultFormStateBehavior` parameters are gone, and the parameters that followed them move up a position; every other parameter, `rootSchema` included, is unchanged:

```diff
-const resolvedSchema = retrieveSchema(validator, schema, rootSchema, formData, customMergeAllOf);
-const isSelectField = isSelect(validator, schema, rootSchema, customMergeAllOf);
+const context: SchemaContext = { validator, customMergeAllOf, defaultFormStateBehavior };
+const resolvedSchema = retrieveSchema(context, schema, rootSchema, formData);
+const isSelectField = isSelect(context, schema, rootSchema);
```

| Function                      | v6 parameters                                                                                       | v7 parameters                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `findFieldInSchema()`         | `validator, rootSchema, schema, path, formData?, customMergeAllOf?`                                 | `context, rootSchema, schema, path, formData?`                                                               |
| `findSelectedOptionInXxxOf()` | `validator, rootSchema, schema, fallbackField, xxx, formData?, customMergeAllOf?`                   | `context, rootSchema, schema, fallbackField, xxx, formData?`                                                 |
| `getClosestMatchingOption()`  | `validator, rootSchema, formData, options, selectedOption?, discriminatorField?, customMergeAllOf?` | `context, rootSchema, formData, options, selectedOption?, discriminatorField?`                               |
| `getDisplayLabel()`           | `validator, schema, uiSchema?, rootSchema?, globalOptions?, customMergeAllOf?`                      | `context, schema, uiSchema?, rootSchema?, globalOptions?`                                                    |
| `getFirstMatchingOption()`    | `validator, formData, options, rootSchema, discriminatorField?`                                     | `context, formData, options, rootSchema, discriminatorField?`                                                |
| `getFromSchema()`             | `validator, rootSchema, schema, path, defaultValue, customMergeAllOf?`                              | `context, rootSchema, schema, path, defaultValue`                                                            |
| `getUiRequiredErrorSchema()`  | _new in v7_                                                                                         | `context, rootSchema, uiSchema, formData, uiSchemaDefinitions?, globalUiOptions?, formContext?, fieldState?` |
| `isFilesArray()`              | `validator, schema, uiSchema?, rootSchema?, customMergeAllOf?`                                      | `context, schema, uiSchema?, rootSchema?`                                                                    |
| `isMultiSelect()`             | `validator, schema, rootSchema?, customMergeAllOf?`                                                 | `context, schema, rootSchema?`                                                                               |
| `isSelect()`                  | `validator, theSchema, rootSchema?, customMergeAllOf?`                                              | `context, theSchema, rootSchema?`                                                                            |
| `omitExtraData()`             | `validator, schema, rootSchema?, formData?, customMergeAllOf?`                                      | `context, schema, rootSchema?, formData?, fieldState?`                                                       |
| `retrieveSchema()`            | `validator, schema, rootSchema?, rawFormData?, customMergeAllOf?, resolveAnyOfOrOneOfRefs?`         | `context, schema, rootSchema?, rawFormData?, resolveAnyOfOrOneOfRefs?, selectedOption?`                      |
| `sanitizeDataForNewSchema()`  | `validator, rootSchema, newSchema?, oldSchema?, data?, customMergeAllOf?`                           | `context, rootSchema, newSchema?, oldSchema?, data?`                                                         |

Double-check `retrieveSchema()`: a v6 call passing `resolveAnyOfOrOneOfRefs` passed `customMergeAllOf` (or `undefined`) before it, so drop that argument instead of only replacing the `validator`.

`createSchemaUtils()` and `SchemaUtilsType.doesSchemaUtilsDiffer()` take a `SchemaContext` and the `rootSchema`:

```diff
-const schemaUtils = createSchemaUtils(validator, rootSchema, defaultFormStateBehavior, customMergeAllOf);
+const schemaUtils = createSchemaUtils({ validator, defaultFormStateBehavior, customMergeAllOf }, rootSchema);
```

`SchemaUtilsType`'s own methods supply the context and root schema themselves, so they are unchanged.

The `computeSkipPopulate()` callback of [`defaultFormStateBehavior.arrayMinItems`](../../api-reference/form-props.md#arrayminitemscomputeskippopulate) receives the `SchemaContext` in effect in place of the `validator`, so any schema function it calls can be handed the form's `customMergeAllOf` too:

```diff
-computeSkipPopulate: (validator, schema, rootSchema) => !isSelect(validator, schema.items, rootSchema),
+computeSkipPopulate: (context, schema, rootSchema) => !isSelect(context, schema.items, rootSchema),
```

`getDefaultFormState()` takes a props object after the context; see [getDefaultFormState() takes a SchemaContext and a props object](./get-default-form-state-takes-a-props-object.md). The `lib/schema/*` helpers such as `computeDefaults()` can no longer be imported; see [the entry on default-state internals](./utils-default-state-internals-not-exported.md).

## Verify

- The type checker accepts every call.
- A `customMergeAllOf` you pass in the context applies through the whole call chain.
