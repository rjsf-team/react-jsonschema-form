---
title: An additionalProperties entry never renders the Optional Data Controls
description: '`enableOptionalDataFieldForType` used to give `additionalProperties` entries Add and Remove controls, and no longer applies to them or the options they show. Update tests, snapshots and styles, and remove an entry with its own remove button.'
packages: ['@rjsf/core']
uses: [ui-schema, markup]
schema: [additional-properties]
affects: [appearance, experience]
related: [root-field-has-no-optional-data-controls]
---

## Detect

- Your uiSchema sets `enableOptionalDataFieldForType`, in `ui:globalOptions`, on an `additionalProperties` entry or on an option it shows.
- Tests, snapshots or CSS that use an entry's `__optionalAdd` or `__optionalRemove` button, or its `rjsf-optional-object-field` or `rjsf-optional-array-field` class.

## Change

The option no longer applies to an `additionalProperties` entry or the `anyOf`/`oneOf` options it shows, wherever it is set. Their Remove button could only store `''`, which blocked submit. An entry is now removed by its own remove button, or stays where a layout grid names its key, which leaves it none. Its object or array no longer has the `rjsf-optional-object-field` or `rjsf-optional-array-field` class.

No code has to change. Update tests, snapshots and styles, and remove an entry with its own remove button, where it has one, instead:

```diff
-await user.click(container.querySelector('[id$="__optionalRemove"]')!);
+await user.click(container.querySelector('.rjsf-object-property-remove')!);
```

## Verify

- Entries render without optional controls, and an object or array declared inside an entry keeps its controls.
