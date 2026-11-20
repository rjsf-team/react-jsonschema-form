---
title: withTheme() returns a ThemedForm
description: "`withTheme()` now returns `ThemedForm<T, S, F>`, a generic function component, where it returned `ComponentType<FormProps<T, S, F>>`. Drop a `ComponentType` annotation of its result and stop setting statics such as `displayName` on it."
packages: ['@rjsf/core']
uses: [custom-theme, typescript]
schema: []
affects: [code]
related: [with-theme-returns-a-function-component]
---

## Detect

- Your code annotates what `withTheme()` returns as `ComponentType<FormProps<…>>`.
- The type checker reports `TS2339: Property 'displayName' does not exist on type 'ThemedForm<unknown, JSONSchema7, object>'` where your code sets or reads a static such as `displayName` on the result of `withTheme()`.

## Change

`withTheme()` returns the new `ThemedForm<T, S, F>`, a function component that is generic over the form data like `Form`. A theme's default `Form` export infers `T` from `formData` or takes it as `<Form<MyData> />`. The `Theme`, `Templates` and `Widgets` exports keep each component's own generic type, so `withTheme<MyData>(Theme)` and `{ ...Templates, FieldTemplate: MyFieldTemplate }` typecheck for any `T`. `generateForm<T, S, F>()` and `generateTheme<T, S, F>()` still exist for pinning the types up front. For the runtime side, see [withTheme() returns a function component](./with-theme-returns-a-function-component.md).

An existing `ComponentType<FormProps<…>>` annotation of the return value still compiles, but it fixes `T` again. Drop it to keep the per-use inference:

```diff
-const ThemedForm: ComponentType<FormProps<MyData>> = withTheme(Theme);
+const ThemedForm = withTheme(Theme);
```

Since `ThemedForm` is a plain generic function type, setting or reading component statics such as `displayName` on the return value no longer type-checks. Remove those uses.

## Verify

- Each use of the themed form infers its form data type from `formData` or its type argument.
- The type checker reports no errors on statics of the themed form.
