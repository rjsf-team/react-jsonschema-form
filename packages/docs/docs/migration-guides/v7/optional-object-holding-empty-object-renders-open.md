---
title: An optional object holding an empty object renders open under the Optional Data Controls
description: With `enableOptionalDataFieldForType` naming `object`, an optional object holding `{}` used to stay behind its Add button and now renders its fields and a Remove button. Leave the object out of the data instead of setting it to `{}` to keep it closed.
packages: ['@rjsf/core']
uses: [ui-schema, form]
schema: [additional-properties, any-of-one-of]
kind: runtime
noticed: test
related: [is-form-data-available-true-for-empty-object, optional-object-with-options-draws-one-add-control, optional-data-controls-read-typeless-options-as-field-type]
---

## Detect

- Your `enableOptionalDataFieldForType` names `object`.
- Your form data, such as `initialFormData` or `formData`, sets an optional object to `{}`.
- On the rendered page or in tests, that object now shows its fields and a Remove button where it showed an Add button.

## Change

An optional object holding `{}` counted as having no data, so it rendered behind its Add button, and an Add that stored `{}`, as one for an object with only `additionalProperties` does, changed nothing ([#5427](https://github.com/rjsf-team/react-jsonschema-form/issues/5427)). `{}` now counts as added data; see [isFormDataAvailable returns true for an empty object](./is-form-data-available-true-for-empty-object.md).

To keep an optional object behind its Add button, leave it out of the data rather than setting it to `{}`:

```diff
- initialFormData={{ meta: {} }}
+ initialFormData={{}}
```

## Verify

- An object holding `{}` reports its `ui:required` properties, and its `type: 'null'` properties get their `null`s in the defaults, as any added object's do.
- Add on an object with only `additionalProperties` now opens it.
- An `anyOf`/`oneOf` switch no longer writes `{}` for an optional object in the new option, array items included, that the old data held nothing for, so it stays behind its Add button, as when the form mounts on that option.
- [`omitExtraData`](../../api-reference/form-props.md#omitextradata) still drops an optional object holding `{}`, so with it set an added object that holds nothing goes back behind its Add button on submit, and under `liveOmit="onChange"` its Add still does nothing.
- An object with `anyOf`/`oneOf` options now draws one set of controls; see [An optional object with anyOf or oneOf options draws one set of Optional Data Controls](./optional-object-with-options-draws-one-add-control.md).
