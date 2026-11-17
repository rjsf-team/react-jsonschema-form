---
title: onKeyRename, onKeyRenameBlur and onRemoveProperty are optional
description: '`onKeyRename`, `onKeyRenameBlur` and `onRemoveProperty` on `FieldTemplateProps` and `WrapIfAdditionalTemplateProps` were required and are now optional. Call them with `?.`.'
packages: ['@rjsf/utils']
uses: [typescript, custom-templates]
schema: []
kind: type
noticed: type-error
related: []
---

## Detect

- In your code: a custom `FieldTemplate` or `WrapIfAdditionalTemplate` that calls `onKeyRename`, `onKeyRenameBlur` or `onRemoveProperty` directly.
- The type checker reports `Cannot invoke an object which is possibly 'undefined'.` (TS2722) on that call.

## Change

The `onKeyRename`, `onKeyRenameBlur` and `onRemoveProperty` a `FieldTemplate` or `WrapIfAdditionalTemplate` receives are undefined for a field `ObjectField` doesn't render, such as the root or an array item, which they always were at runtime. Call them with `?.`:

```diff
-onKeyRename(newKey);
+onKeyRename?.(newKey);
```

## Verify

- The type checker accepts the calls.
- Every property `ObjectField` renders gets these handlers, so they don't tell an additional property from a declared one. A template that used their presence to detect an additional property needs another check.
