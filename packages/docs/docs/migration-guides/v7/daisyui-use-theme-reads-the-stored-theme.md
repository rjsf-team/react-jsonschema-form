---
title: daisyUI's useTheme() names the stored theme wherever it is called
description: "`useTheme()` used to read a per-provider context and returned `night` outside a `ThemeProvider`. It now reads the theme stored under `daisyui-theme`, else `cupcake`, and every provider shares it; set `data-theme` yourself where you need another."
packages: ['@rjsf/daisyui']
uses: [custom-theme]
schema: []
affects: [appearance, code]
related: [daisyui-theme-context-removed]
---

## Detect

- In your code, a `useTheme()` from `@rjsf/daisyui` called outside any `ThemeProvider`, such as `data-theme={useTheme().theme}`.
- More than one `ThemeProvider` on a page, each expected to keep its own theme.
- Code that relies on `setTheme()` affecting only its own provider.

## Change

`useTheme()` read `ThemeContext`, which each `ThemeProvider` filled with the theme stored in `localStorage` under `daisyui-theme` when it mounted, or `cupcake` where none was stored. Outside a provider it got the context's default: `night`, which nothing on the page shows, and a `setTheme()` that did nothing.

`useTheme()` now reads the stored theme itself, as an external store, wherever it is called, and its `setTheme()` stores one:

- Inside `DaisyUIFrameProvider` it names the theme that frame shows: the frame's chosen `dataTheme` where it has one, which a stored theme doesn't change, and the stored theme where it has none.
- Everywhere else, every caller names the same theme, and follows one that another caller, `DaisyUIFrameProvider` or another tab stores.
- Where nothing is stored, or the storage can't be read, it names `cupcake`.
- The server has no storage, so it renders a frame's chosen `dataTheme`, or `cupcake` where none is chosen. A hydrating client starts from the same theme, then shows the stored theme where no `dataTheme` is chosen.
- `ThemeProvider` holds no theme of its own and renders its children as they are. Two providers on one page used to each keep the theme stored when they mounted. Now a `setTheme()` called under either one changes the theme every `useTheme()` names, inside both providers and outside them.

To keep showing `night` where `useTheme()` returned it outside a provider, write it directly:

```diff
-<div data-theme={useTheme().theme}>
+<div data-theme='night'>
```

Give providers that should show different themes their own `data-theme` on a wrapping element. A `ThemeProvider` can be removed; leaving it in place changes nothing.

## Verify

- Pages that read `useTheme()` outside a provider show the theme you intend, where they now get the stored theme or the light `cupcake`.
- Changing the theme in one part of the page changes it everywhere except where you set `data-theme` yourself or a `DaisyUIFrameProvider` has a `dataTheme`.
