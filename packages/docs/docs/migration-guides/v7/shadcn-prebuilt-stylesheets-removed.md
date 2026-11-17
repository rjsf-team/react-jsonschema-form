---
title: The shadcn theme no longer ships prebuilt stylesheets
description: The prebuilt `dist/<theme>.css` stylesheets of `@rjsf/shadcn` are gone, and the theme is now styled by your app's Tailwind build. Add `@source` for `node_modules/@rjsf/shadcn/lib` to your Tailwind CSS and take colors from your shadcn setup.
packages: ['@rjsf/shadcn']
uses: [tooling, markup]
schema: []
kind: removal
noticed: build
related: []
---

## Detect

- An import of `@rjsf/shadcn/dist/<theme>.css` in your app, such as `dist/default.css`. The removed files were `default`, `amethyst-haze`, `caffeine`, `claude`, `clean-slate`, `neo-brutalism`, `pastel-dreams`, `soft-pop`, `twitter` and `vercel`.
- Your bundler fails to resolve that stylesheet.

## Change

The compiled stylesheets and the `src/css` directory they were built from are gone. Each one was a full Tailwind build for one fixed set of design tokens, preflight reset included, so importing it restyled the whole page and ignored your own shadcn theme.

Remove the stylesheet import and add the package to your Tailwind sources instead:

```css
@import 'tailwindcss';
@source "../node_modules/@rjsf/shadcn/lib";
```

Adjust the relative path so it points from your CSS file to `node_modules`. The form then picks up the CSS variables from your `shadcn init` setup.

If you imported a prebuilt theme for its colors, generate the same variables with [tweakcn](https://tweakcn.com/editor/theme) into your global CSS. The playground's [theme sources](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/playground/src/themes/shadcn) hold the token sets the old stylesheets were built from.

## Verify

- No code imports a `@rjsf/shadcn` `dist/` stylesheet.
- The form's inputs and buttons have their shadcn styles, in your theme's colors.
- The rest of the page keeps its own styles.
