---
title: Custom FieldTemplate and WrapIfAdditionalTemplate handle the keyNotAllowed prop
description: Every theme's `FieldTemplate` now hands `WrapIfAdditionalTemplate` a new `keyNotAllowed` prop. A custom `FieldTemplate` that forwards props one by one adds it, and a custom `WrapIfAdditionalTemplate` that spreads the rest onto an element leaves it out.
packages: ['@rjsf/core']
uses: [custom-templates]
schema: [additional-properties]
kind: markup
noticed: runtime-error
related: [forbidden-extra-key-row-shows-error, custom-templates-take-error-state-from-has-errors]
---

## Detect

- Your custom `FieldTemplate` renders `WrapIfAdditionalTemplate` and lists the props it passes one by one.
- Your custom `WrapIfAdditionalTemplate` spreads the props it doesn't use onto a DOM element, and React warns in the console about an unknown `keyNotAllowed` prop on that element.

## Change

A custom `FieldTemplate` adds `keyNotAllowed` to the props it forwards, or the forbidden key isn't marked:

```diff
 <WrapIfAdditionalTemplate
   hasErrors={hasErrors}
   keyName={keyName}
+  keyNotAllowed={keyNotAllowed}
   {...otherForwardedProps}
 >
```

The other props it forwards, `hasErrors` and `keyName`, are covered in [Custom field, array and object templates take their error state from hasErrors](./custom-templates-take-error-state-from-has-errors.md).

A custom `WrapIfAdditionalTemplate` that spreads the rest of its props leaves `keyNotAllowed` out:

```diff
-const { children, label, ...rest } = props;
+const { children, label, keyNotAllowed, ...rest } = props;
 return <div {...rest}>{children}</div>;
```

## Verify

- A forbidden key's row shows `The key "%1" is not allowed here`.
- React logs no unknown-prop warning for `keyNotAllowed`.
