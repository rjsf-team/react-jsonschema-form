---
title: A submit button is aria-disabled and cancels clicks while onSubmit is pending
description: "While a promise from `onSubmit` is pending, the submit button gets `pending`, `aria-disabled` and an `onClick` that cancels the click. Style `[aria-disabled='true']` or read the `pending` prop in a custom `SubmitButton` to show it."
packages: ['@rjsf/core']
uses: [custom-templates, markup]
schema: []
kind: runtime
noticed: test
related: [async-on-submit-ignores-submits-until-settled]
---

## Detect

- Your `onSubmit` returns a promise, and your tests or CSS select the submit button's attributes.
- Your custom `SubmitButton` spreads the props of `ui:submitButtonOptions`.
- Your `ui:submitButtonOptions` props set an `onClick`.

## Change

While the promise `onSubmit` returned is pending, the submit button gets `pending` and `aria-disabled` (see [Submitting](../../usage/submitting.md)). A custom `SubmitButton` that spreads the props of `ui:submitButtonOptions` gets `aria-disabled`, and an `onClick` that cancels the click. An `onClick` those props set still runs first, with the click event, and the submit is ignored.

Style `[aria-disabled='true']`, or read the new `pending` prop, to show it:

```diff
+button[type='submit'][aria-disabled='true'] {
+  opacity: 0.6;
+}
```

## Verify

- Tests that snapshot or query the submit button during a pending submit expect `aria-disabled="true"`.
- A click while pending runs your `onClick` and doesn't submit again.
