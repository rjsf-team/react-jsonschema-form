---
title: Undeclared ui:submitButtonOptions props are unknown
description: 'The undeclared keys of `ui:submitButtonOptions.props` were `any` and no longer read back, while `getSubmitButtonOptions()` always returns `props`. Check a key with `in` and narrow its value, and annotate inline handlers for undeclared keys.'
packages: ['@rjsf/utils']
uses: [typescript, custom-templates, ui-schema]
schema: []
kind: type
noticed: type-error
related: []
---

## Detect

- In your code: a custom `SubmitButton` that reads a prop other than `disabled`, `className`, `onClick` or `onClickCapture` from `getSubmitButtonOptions(uiSchema).props`.
- In your uiSchema: an inline handler under `ui:submitButtonOptions.props` for a key other than `onClick` or `onClickCapture`, such as `onMouseEnter`, with no type on its parameter.
- The type checker reports `Property 'variant' does not exist on type …` (TS2339) for the read, or `Parameter 'event' implicitly has an 'any' type.` (TS7006) for the handler.

## Change

The undeclared keys of `UISchemaSubmitButtonOptions.props` were `any`. `props` is now any object, of which only the declared props read back: it declares `disabled`, `className`, `onClick` and `onClickCapture`. A custom `SubmitButton` that reads a prop of its own checks for it, then narrows its `unknown` value. `getSubmitButtonOptions()` always returns `props`, the default ones when the uiSchema's are missing or aren't an object. Its return type is `SubmitButtonOptions`; annotated as `UISchemaSubmitButtonOptions`, its `props` are optional again:

```diff
-const variant = getSubmitButtonOptions(uiSchema).props?.variant;
+const { props } = getSubmitButtonOptions(uiSchema);
+const variant = 'variant' in props && typeof props.variant === 'string' ? props.variant : undefined;
```

A handler written inline for an undeclared key of `ui:submitButtonOptions.props` gets no type for its parameter from `UiSchema`, so annotate the parameter. `onClick` and `onClickCapture` are declared, so theirs still comes from the type:

```diff
-const uiSchema: UiSchema = { 'ui:submitButtonOptions': { props: { onMouseEnter: (event) => track(event) } } };
+const uiSchema: UiSchema = {
+  'ui:submitButtonOptions': { props: { onMouseEnter: (event: MouseEvent<HTMLElement>) => track(event) } },
+};
```

## Verify

- The type checker accepts your `SubmitButton` and the uiSchema that sets its props.
- The button still renders with the props you set, since nothing changes at runtime.
