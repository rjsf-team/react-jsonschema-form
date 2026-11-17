---
title: 'Clearing a custom error removes it from the error list too'
description: 'Clearing an error a field raised through `onChange` used to remove it from the field but leave it in the error list until the next validation. Both now drop it at once; update tests that expect it still listed.'
packages: ['@rjsf/core']
uses: [custom-widgets, custom-fields, markup]
schema: []
kind: runtime
noticed: test
related: [field-raised-errors-kept-apart-from-validator-errors]
---

## Detect

- In your field, widget or template: an error raised by passing an `errorSchema` as the third argument of `onChange`, then cleared by calling `onChange` for the same path with no `errorSchema`.
- In your tests: an assertion that the cleared error is still listed by the `ErrorListTemplate` at the top of the form.

## Change

A field raises its own error like this:

```tsx
onChange(value, fieldPath, { __errors: ['must be a company address'] });
```

Clearing it now removes the entry from the field and from the list the `ErrorListTemplate` renders at the same time. Update tests that expect it still listed:

```diff
 await user.clear(input);
-expect(within(errorList).getByText('must be a company address')).toBeInTheDocument();
+expect(within(errorList).queryByText('must be a company address')).not.toBeInTheDocument();
```

## Verify

- After the field clears its error, neither the field nor the error list shows it.
