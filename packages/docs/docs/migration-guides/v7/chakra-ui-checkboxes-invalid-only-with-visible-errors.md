---
title: 'In chakra-ui, CheckboxesWidget is marked invalid only once it has visible errors'
description: 'A required, empty chakra-ui `CheckboxesWidget` used to be flagged invalid from the first render; it is now flagged only once validation reports an error, and then every checkbox is marked. Update tests and CSS reading `aria-invalid` or `data-invalid`.'
packages: ['@rjsf/chakra-ui']
uses: [markup]
schema: [arrays, enums]
kind: markup
noticed: test
related: [ui-hide-error-suppresses-theme-error-styling]
---

## Detect

- In your `@rjsf/chakra-ui` tests or CSS: `aria-invalid` or `data-invalid` on a `CheckboxesWidget` or its checkboxes.
- On the rendered page: a required, empty checkboxes field is no longer marked invalid on first render.

## Change

The inner `CheckboxGroup` was marked invalid whenever the field was required and had nothing selected, before validation found anything and whatever `ui:hideError` said, so every checkbox carried `aria-invalid="true"` and `data-invalid` from the first render. That state now comes from the field's visible errors like every other error state, and no option brings the old behavior back. Once the field has visible errors, every checkbox is marked invalid with `aria-invalid="true"` and `data-invalid`, where a field that was not required used to mark only the surrounding fieldset.

Assert the invalid state after validation has run:

```diff
-expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute('aria-invalid', 'true');
+await user.click(screen.getByRole('button', { name: 'Submit' }));
+expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute('aria-invalid', 'true');
```

## Verify

- A required checkboxes field is unflagged on first render and flagged on every checkbox once validation reports an error.
