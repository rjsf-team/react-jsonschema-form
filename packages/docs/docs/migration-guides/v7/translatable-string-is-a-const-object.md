---
title: TranslatableString is an as const object instead of an enum
description: '`TranslatableString` used to be an `enum`, and is now an `as const` object with a union type of the same name, so a member used as a type stops compiling. Write `typeof TranslatableString.Member` there.'
packages: ['@rjsf/utils']
uses: [typescript]
schema: []
kind: type
noticed: type-error
related: [translate-string-table-needs-new-keys]
---

## Detect

- The type checker reports `'TranslatableString' only refers to a type, but is being used as a namespace here.` (TS2702) at a member used in a type position, such as `TranslatableString.ArrayItemTitle` in a type annotation.

## Change

`TranslatableString` from `@rjsf/utils` is an `as const` object with a union type of the same name. Its values and member access, such as `TranslatableString.ArrayItemTitle`, are unchanged, so code that only reads them keeps working. Code that uses a member as a type names its type with `typeof`:

```diff
-const key: TranslatableString.ArrayItemTitle = TranslatableString.ArrayItemTitle;
+const key: typeof TranslatableString.ArrayItemTitle = TranslatableString.ArrayItemTitle;
```

The union type itself is still written by name, so `TranslatableString` as a type needs no change. `GridType` and `Operators`, which `@rjsf/core` now exports, are `as const` objects the same way, so use `typeof GridType.ROW` for a member of those as a type.

## Verify

- The code compiles, and comparisons such as `stringToTranslate === TranslatableString.ArrayItemTitle` still work.
