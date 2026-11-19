---
title: daisyUI's ThemeContext is removed in favor of useTheme()
description: "`ThemeContext`, reachable only through `@rjsf/daisyui/lib/theme/`, is gone. Read the theme with `useTheme()`, and give part of a page its own theme with `data-theme` on a wrapping element."
packages: ['@rjsf/daisyui']
uses: [custom-theme]
schema: []
affects: [code, setup]
related: [daisyui-use-theme-reads-the-stored-theme, deep-imports-removed]
---

## Detect

- In your code, an import of `ThemeContext` from `@rjsf/daisyui/lib/theme/Theme.js` or `@rjsf/daisyui/lib/theme/index.js`. Your bundler reports that the module can't be resolved.
- A `ThemeContext.Provider` in your JSX.

## Change

`ThemeContext` is gone. It was never exported from the package root, and [deep imports no longer resolve](./deep-imports-removed.md) anyway.

Read the theme with `useTheme()`:

```diff
-import { ThemeContext } from '@rjsf/daisyui/lib/theme/Theme.js';
-const { theme, setTheme } = useContext(ThemeContext);
+import { useTheme } from '@rjsf/daisyui';
+const { theme, setTheme } = useTheme();
```

A `ThemeContext.Provider` that gave part of a page a theme of its own no longer reaches `useTheme()`, which names the stored theme everywhere but inside a `DaisyUIFrameProvider` with a chosen `dataTheme`. Keep that theme in your own state, and give it to daisyUI through `data-theme` on an element around that part:

```diff
-<ThemeContext.Provider value={{ theme: 'dark', setTheme }}>
+<div data-theme='dark'>
   <Form schema={schema} validator={validator} />
-</ThemeContext.Provider>
+</div>
```

## Verify

- The build resolves every `@rjsf/daisyui` import.
- The part of the page you wrapped shows the theme you set on it.
