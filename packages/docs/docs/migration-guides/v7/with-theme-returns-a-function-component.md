---
title: withTheme() returns a function component, which useState calls as an initializer
description: "`withTheme()` now returns a plain function component instead of a `forwardRef` object, so `useState(withTheme(theme))` calls it as an initializer and throws. Wrap it in a lazy initializer, `useState(() => withTheme(theme))`."
packages: ['@rjsf/core']
uses: [custom-theme]
schema: []
affects: [code]
related: [with-theme-returns-a-themed-form]
---

## Detect

- Your code passes the result of `withTheme()` straight to `useState()` or a state setter, such as `useState(withTheme(theme))` or `setFormComponent(withTheme(theme))`.
- The page throws when that `useState()` or setter call runs.

## Change

`withTheme()` now returns a plain function component instead of a `forwardRef`-wrapped one, now that React 19 supports passing `ref` as a regular prop to function components. React treats a bare function passed to `useState()` or a setter as a lazy initializer or updater and calls it immediately with no arguments, which throws. A `forwardRef` object isn't a function, so this pattern happened to work before.

Wrap it in a lazy initializer:

```diff
-const [ThemedForm, setThemedForm] = useState(withTheme(theme));
+const [ThemedForm, setThemedForm] = useState(() => withTheme(theme));
-setThemedForm(withTheme(otherTheme));
+setThemedForm(() => withTheme(otherTheme));
```

Its return type changed too; see [withTheme() returns a ThemedForm](./with-theme-returns-a-themed-form.md).

## Verify

- The themed form renders and switching themes doesn't throw.
