---
title: The UMD bundles are gone
description: The `dist/<name>.umd.js` bundles are no longer published, so a `<script>` tag that loads one from a CDN fails. Load the package from an ESM CDN such as esm.sh, or install it and use a bundler.
packages: ['*']
uses: [tooling]
schema: []
kind: install
noticed: runtime-error
related: [esm-only-packages]
---

## Detect

- A `<script>` tag in your HTML whose `src` points at an `@rjsf/*` `dist/<name>.umd.js` file on a CDN.
- The browser console reports a failed request for that file, or that the global it defined is undefined.

## Change

Every package now ships only ESM, see [every RJSF package ships only ESM](./esm-only-packages.md). Load it as a module from an ESM CDN:

```html
<script type="module">
  import Form from 'https://esm.sh/@rjsf/core';
</script>
```

Or install the packages and build your page with a bundler.

## Verify

- No page loads a `.umd.js` file from an `@rjsf/*` package.
- The form renders and the console shows no failed module requests.
