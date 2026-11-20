---
title: daisyUI no longer ships src/styles.css or installs tailwindcss
description: "`@rjsf/daisyui` removed its undocumented `src/styles.css` and its `tailwindcss` dependency. Import Tailwind and the daisyUI plugin from your own stylesheet, and add `tailwindcss` to your own dependencies."
packages: ['@rjsf/daisyui']
uses: [tooling]
schema: []
affects: [setup, appearance]
related: []
---

## Detect

- In your stylesheet, an import of `@rjsf/daisyui/src/styles.css` through its path in `node_modules`.
- In your `package.json`, no `tailwindcss` dependency of your own while your app uses Tailwind.
- Your CSS build fails to find the file or `tailwindcss`.

## Change

`@rjsf/daisyui` published `src/styles.css`, which imported Tailwind's `preflight` and `utilities` layers and set `--color-primary` and `--color-secondary` on `:root`. The package's `exports` never let it be imported by name, so it is removed, along with the `tailwindcss` dependency only it used.

Load Tailwind and daisyUI from your own stylesheet, as daisyUI's setup asks:

```diff
-@import '../node_modules/@rjsf/daisyui/src/styles.css';
+@import 'tailwindcss';
+@plugin 'daisyui';
```

Don't carry the two variables over. They were Tailwind 3 style RGB triplets, which daisyUI 5 reads as invalid colors, so `btn-primary` and `bg-primary` lose their color. Set a daisyUI theme's colors instead.

If you relied on `@rjsf/daisyui` to install `tailwindcss`, add it to your own dependencies.

## Verify

The CSS build succeeds, and primary and secondary buttons show your daisyUI theme's colors.
