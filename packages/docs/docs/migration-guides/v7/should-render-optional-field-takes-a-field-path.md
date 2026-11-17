---
title: shouldRenderOptionalField takes the field path as a required fifth argument
description: '`shouldRenderOptionalField()` now takes a required `fieldPath` fifth argument, and its `uiSchema` argument is no longer optional. Pass the `fieldPath` from your field''s props.'
packages: ['@rjsf/utils']
uses: [custom-fields, utils-api]
schema: []
kind: removal
noticed: type-error
related: [removed-option-scoring-and-root-schema-utils, root-field-has-no-optional-data-controls]
---

## Detect

- In your code, a call to `shouldRenderOptionalField()` from `@rjsf/utils`.
- The type checker reports `Expected 5 arguments, but got 4.` or `Expected 5 arguments, but got 3.`
- In JavaScript, nothing reports it: the root field renders behind an Add button, since a missing `fieldPath` isn't the root's.

## Change

Pass the field's `fieldPath` from its props, and pass `uiSchema` even when it's `undefined`:

```diff
-shouldRenderOptionalField(registry, schema, required, uiSchema);
+shouldRenderOptionalField(registry, schema, required, uiSchema, fieldPath);
```

## Verify

- It returns `false` for the root field (see [The root field never renders the Optional Data Controls](./root-field-has-no-optional-data-controls.md)).
- It no longer mistakes a nested field for the root. The option a root `anyOf`/`oneOf` selects no longer gets the controls, and a nested object or array that a recursive `$ref: '#'` describes now does.
