---
title: A localizer gets quoted property names from a precompiled or ata validator
description: "A `localizer` for a precompiled or ata validator now gets property names in error params quoted, such as `'foo'`. Strip the quotes before looking a name up, and update snapshots of untitled messages."
packages: ['@rjsf/validator-ajv8', '@rjsf/validator-ata']
uses: [custom-validator, markup]
schema: []
affects: [code, experience]
related: [precompiled-validator-takes-an-options-object]
---

## Detect

- Your code passes a `localizer` to `createPrecompiledValidator()` from `@rjsf/validator-ajv8`, or to `customizeValidator()` or `createPrecompiledValidator()` from `@rjsf/validator-ata`.
- That localizer reads the `missingProperty`, `property` or (for `@rjsf/validator-ajv8`) `deps` params of an error.
- Your snapshots hold localized messages for properties with no title.

## Change

Each property name in the `missingProperty` and `property` params now arrives quoted, such as `'foo'` where it was `foo`, as `customizeValidator()` from `@rjsf/validator-ajv8` already did. For `@rjsf/validator-ajv8`, each name in `deps` is quoted too. The quotes let these validators replace the name in a localized message with the property's `title` or `ui:title`.

A property with no title keeps its key, now quoted. With `ajv-i18n`'s Spanish messages a missing untitled `foo` reads `debe tener la propiedad requerida 'foo'` where it read `debe tener la propiedad requerida foo`. Update the snapshots that hold such messages.

A localizer that looks a property up by its param, such as in a map of labels, strips the quotes first:

```diff
-error.message = labels[error.params.missingProperty];
+error.message = labels[error.params.missingProperty.slice(1, -1)];
```

## Verify

- Messages show the property's `title` or `ui:title` where it has one, and your label lookups find their entries.
- The localizer gets copies of the errors, and only the `message` it sets on each is kept, so other edits to the error have no effect.
- The errors `rawValidation()` returns keep their params unquoted.
