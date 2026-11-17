---
title: A form's customMergeAllOf and defaultFormStateBehavior apply where they used to be dropped
description: "Four places ignored a form's `customMergeAllOf` or `defaultFormStateBehavior`, including the defaults handed to `customValidate`. They now apply them; recheck results, and pass `getCustomValidateFormData` when you call `validateFormData()` directly."
packages: ['@rjsf/core', '@rjsf/utils', '@rjsf/validator-ajv8', '@rjsf/validator-ata']
uses: [form-props, custom-validator]
schema: [defaults]
kind: runtime
noticed: review
related: [precompiled-validator-takes-custom-merge-all-of, schema-functions-take-schema-context]
---

## Detect

- In your code, a `Form` that sets `customMergeAllOf` or `defaultFormStateBehavior`, especially with `omitExtraData`, a `customValidate`, or `allOf` in its schema.
- A direct call to a validator's `validateFormData()` with a `customValidate`.

## Change

The schema functions used to copy these settings one by one into every function they called, and several calls left one out ([#4383](https://github.com/rjsf-team/react-jsonschema-form/pull/4383), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385)). Four places that dropped a setting now apply it:

- `SchemaUtilsType.omitExtraData()` never passed the form's `customMergeAllOf` on, so the `allOf`s it merged were always merged the default way.
- An `allOf` reached through a `$ref` option of a `oneOf` inside `dependencies` was always merged the default way.
- The defaults handed to `customValidate` were computed with neither the `customMergeAllOf` nor the `defaultFormStateBehavior` of the form.
- The precompiled validators of `@rjsf/validator-ajv8` and `@rjsf/validator-ata` resolved their root schema with the default `allOf` merge, so under `liveValidate` a form with a `customMergeAllOf` and an `allOf` in its root schema failed with "The schema associated with the precompiled validator differs from the rootSchema provided for validation". They now resolve it with the `customMergeAllOf` they were constructed with; see [createPrecompiledValidator() takes the form's customMergeAllOf](./precompiled-validator-takes-custom-merge-all-of.md).

`validateFormData()` takes one new optional trailing parameter, `getCustomValidateFormData`: a function returning the form data to hand `customValidate`, with the defaults already applied. `Form` supplies it from its own `SchemaUtils`. Left out, the validator computes the defaults itself exactly as it did in v6, so a direct caller keeps v6 behaviour. To get the form's settings, pass it:

```diff
 validator.validateFormData(formData, schema, customValidate, transformErrors, uiSchema);
+validator.validateFormData(formData, schema, customValidate, transformErrors, uiSchema, () => schemaUtils.getDefaultFormState(schema, formData, true, undefined, uiSchema));
```

## Verify

- Extra data omitted from a form with `customMergeAllOf` matches the merged schema you expect.
- `customValidate` receives defaults that follow your `defaultFormStateBehavior`.
