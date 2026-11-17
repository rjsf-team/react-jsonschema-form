---
title: The registry from getTestRegistry is frozen
description: 'The registry `getTestRegistry()` returns is frozen at runtime, with its `fields`, `templates` and `widgets` maps, `ButtonTemplates` and presentation, so a test that mutates it throws. Build a copy with your changes or pass them as arguments.'
packages: ['@rjsf/core']
uses: [custom-fields, custom-widgets, custom-templates]
schema: []
kind: runtime
noticed: test
related: [get-test-registry-moved-to-core-testing, registry-members-are-read-only]
---

## Detect

- A test that assigns into the result of `getTestRegistry()`, or into its `fields`, `templates`, `widgets` or `templates.ButtonTemplates`, such as `registry.widgets.MyWidget = MyWidget`.
- The test throws a `TypeError` such as `Cannot assign to read only property` or `Cannot add property MyWidget, object is not extensible`.

## Change

`getTestRegistry()` from `@rjsf/core/testing` (see [getTestRegistry moved to @rjsf/core/testing](./get-test-registry-moved-to-core-testing.md)) freezes the registry it returns, along with its `fields`, `templates` and `widgets` maps, the nested `ButtonTemplates` and the presentation. A mutation now throws instead of silently affecting later assertions.

Pass your fields, templates and widgets to `getTestRegistry()` as arguments, or spread the frozen registry into a new object:

```diff
 const registry = getTestRegistry(schema);
-registry.widgets.MyWidget = MyWidget;
+const testRegistry = { ...registry, widgets: { ...registry.widgets, MyWidget } };
```

The freeze is shallow by design. Objects you own, such as `formContext`, `rootSchema` and the validator's internal caches, stay unfrozen. The registry type is read-only as well, see [Registry members are read-only](./registry-members-are-read-only.md).

## Verify

The tests that used to mutate the registry pass, and no test throws on assigning into it.
