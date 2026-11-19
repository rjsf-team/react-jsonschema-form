---
title: Registry members are read-only
description: 'Every member of the `Registry` type in `@rjsf/utils` is now `readonly`, so assigning into a received registry fails to compile. Build a modified copy with the changed member and pass that down instead.'
packages: ['@rjsf/utils']
uses: [typescript, custom-fields, custom-widgets, custom-templates]
schema: []
affects: [code]
related: [component-props-are-read-only, test-registry-is-frozen]
---

## Detect

- An assignment to a member of a registry your code received, such as `registry.globalUiOptions = ` or `registry.formContext = `.
- Type checker: `Cannot assign to 'globalUiOptions' because it is a read-only property.` (or the same for another member).

## Change

The registry is what `Form` builds from its props and hands down to fields, widgets and templates. Nothing should write back into it, and the type now enforces that. Build a modified copy and pass that down:

```diff
-registry.globalUiOptions = { enableMarkdownInHelp: true };
+const registry = { ...baseRegistry, globalUiOptions: { enableMarkdownInHelp: true } };
```

Only the registry's own members are read-only. The component maps it holds are not deeply read-only, so `registry.widgets.MyWidget = ...` still compiles. Override widgets, fields and templates through the `Form` props or `withTheme()` instead of writing into the maps.

The `registry` prop itself is read-only too, see [schema, uiSchema and registry props are read-only](./component-props-are-read-only.md). In tests, the registry from `getTestRegistry()` is also frozen at runtime, see [the registry from getTestRegistry is frozen](./test-registry-is-frozen.md).

## Verify

The type checker reports no read-only assignment on a registry, and the components that received your changed copy show the changed options.
