---
title: The daisyUI file input ignores ui:options.multiple
description: "@rjsf/daisyui now renders core's file input, so `ui:options.multiple` no longer makes it accept several files. Make the field an array of files, `type: 'array'` with `items` of `format: 'data-url'`, to accept several."
packages: ['@rjsf/daisyui']
uses: [ui-schema]
schema: [arrays]
kind: runtime
noticed: review
related: [daisyui-renders-core-components]
---

## Detect

- `ui:options` with `multiple: true` on a file field in a `uiSchema` rendered by `@rjsf/daisyui`.
- On the rendered page, that file input lets the user pick only one file.

## Change

The file input is now core's, which accepts several files where the field is an array of files, as in every other theme. A single string field holds one file. Change the schema of a field that takes several files:

```diff
 const schema = {
-  type: 'string',
-  format: 'data-url',
+  type: 'array',
+  items: { type: 'string', format: 'data-url' },
 };
-const uiSchema = { 'ui:options': { multiple: true } };
```

The form data for the field becomes an array of data URLs, so update the code that reads it.

## Verify

- The file input accepts several files and the field's value is an array with one data URL per file.
