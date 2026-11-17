---
title: An edit clears the validator errors of the fields it changed
description: Without live validation, an edit now clears the validator's errors of the fields it changed in every form, where v6 did so only for a form passed `formData`. Update tests that expect those errors to stay after an edit.
packages: ['@rjsf/core']
uses: [form]
schema: []
kind: runtime
noticed: test
related: []
---

## Detect

- A form without `liveValidate` that isn't passed `formData`, in your code.
- Tests that submit or validate, edit a field with an error, and expect the error to stay on that field.

## Change

Without live validation, editing a field clears the validator's errors for the fields that edit changed. v6 did this only for a form passed `formData`; it now holds for every form. Errors on fields the edit didn't touch stay. Update tests to expect the edited field's error to clear, and validate again to see it return.

## Verify

- After an edit, the edited field shows no validator error until the next validation or submit.
- Errors that an item reorder, a property rename or an option switch moved stay with the values they moved with.
