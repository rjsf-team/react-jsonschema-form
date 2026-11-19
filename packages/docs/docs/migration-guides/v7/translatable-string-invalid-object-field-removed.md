---
title: TranslatableString.InvalidObjectField is removed
description: "`TranslatableString.InvalidObjectField` named the error an incomplete `ui:order` used to render, and is removed since the object now renders. Drop that case from a custom `translateString`, which no longer compiles with it."
packages: ['@rjsf/utils']
uses: [typescript, form-props]
kind: removal
noticed: type-error
related: [file-info-is-plain-text, translate-string-table-needs-new-keys]
---

## Detect

- In a custom `translateString` or a translation table, a reference to `TranslatableString.InvalidObjectField`.
- The type checker reports `Property 'InvalidObjectField' does not exist on type` followed by the type of `TranslatableString`.

## Change

An incomplete `ui:order` no longer renders an error, so no string names it. Remove the case:

```diff
 switch (key) {
-  case TranslatableString.InvalidObjectField:
-    return translated.invalidObjectField;
   default:
     return englishStringTranslator(key, params);
 }
```

## Verify

- The custom `translateString` compiles.
