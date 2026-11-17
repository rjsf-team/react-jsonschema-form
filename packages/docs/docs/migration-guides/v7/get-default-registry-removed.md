---
title: getDefaultRegistry is removed
description: The `getDefaultRegistry()` export of `@rjsf/core` is removed. Use `generateTheme()` for the core fields, widgets and templates, a single generator such as `generateFields()`, or import the one component you need.
packages: ['@rjsf/core']
uses: [custom-fields, custom-widgets, custom-templates]
schema: []
kind: removal
noticed: type-error
related: [form-get-registry-is-build-registry]
---

## Detect

- `getDefaultRegistry` imported from `@rjsf/core` in your code.
- Type checker: `Module '"@rjsf/core"' has no exported member 'getDefaultRegistry'.` (TS2614)

## Change

`getDefaultRegistry()` returned the core fields, widgets and templates with placeholder `rootSchema`, `formContext`, `translateString` and `globalFormOptions` values that `Form` overwrote anyway. Use `generateTheme()` for all three dictionaries:

```diff
-import { getDefaultRegistry } from '@rjsf/core';
+import { generateTheme } from '@rjsf/core';

-const { fields, widgets, templates } = getDefaultRegistry();
+const { fields, widgets, templates } = generateTheme();
```

Use the individual generator for the one dictionary you need:

```diff
-import { getDefaultRegistry } from '@rjsf/core';
+import { generateFields } from '@rjsf/core';

-const { StringField } = getDefaultRegistry().fields;
+const { StringField } = generateFields();
```

To reuse a single component, import it directly, as in `import { StringField } from '@rjsf/core'`, so the rest of the core components stay out of your bundle. To build a full registry, see [Form.getRegistry is now the buildRegistry export](./form-get-registry-is-build-registry.md).

## Verify

- The type checker no longer reports a missing `getDefaultRegistry` export.
- Your code renders the same core components as before.
