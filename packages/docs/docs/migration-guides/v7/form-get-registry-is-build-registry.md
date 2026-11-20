---
title: Form.getRegistry is now the buildRegistry export
description: The static `Form.getRegistry()` is removed and its logic is now the standalone `buildRegistry()` export of `@rjsf/core`. Call `buildRegistry(props, schema, schemaUtils)`, or use the `registry` prop inside a component.
packages: ['@rjsf/core']
uses: [custom-fields, custom-widgets, custom-templates]
schema: []
affects: [code]
related: [get-test-registry-moved-to-core-testing, get-default-registry-removed]
---

## Detect

- `Form.getRegistry(` in your code.
- Type checker: `Property 'getRegistry' does not exist on type '<T = unknown, S extends StrictRJSFSchema = JSONSchema7, F extends FormContextType = object>(props: FormProps<T, S, F>) => Element'.` (TS2339) on that call.

## Change

`getRegistry()` was a `static` on the `Form` class. It is now `buildRegistry()`, exported from `@rjsf/core`, and it takes the same arguments:

```diff
-import Form from '@rjsf/core';
+import { buildRegistry } from '@rjsf/core';

-const registry = Form.getRegistry(props, schema, schemaUtils);
+const registry = buildRegistry(props, schema, schemaUtils);
```

Most code never needs it. Inside a field, widget or template, use the `registry` prop you already receive. It is the registry the `Form` rendered with, including its real `schemaUtils`.

To build a registry for a test, use `getTestRegistry()` from `@rjsf/core/testing`, see [getTestRegistry moved to @rjsf/core/testing](./get-test-registry-moved-to-core-testing.md). For the core component dictionaries alone, use `generateTheme()`, see [getDefaultRegistry is removed](./get-default-registry-removed.md).

## Verify

- The type checker no longer reports `getRegistry` on `Form`.
- The registry your code builds holds the same fields, widgets and templates as before.
