---
title: The Widget type is a SlotComponent and has no MergedWidget member
description: "The `Widget` type is now `SlotComponent<WidgetProps>` and no longer has the `MergedWidget` property. Drop references to `Widget['MergedWidget']` and annotate a value typed `Widget` as `Widget` instead of a React `ComponentType`."
packages: ['@rjsf/utils']
uses: [typescript, custom-widgets]
schema: []
kind: type
noticed: type-error
related: [widget-default-props-options-not-merged, templates-read-from-props-are-slot-components]
---

## Detect

- Your TypeScript code reads `Widget['MergedWidget']`; the type checker reports that `MergedWidget` doesn't exist on the type.
- Your code assigns a value typed `Widget` to a React `ComponentType` or `FunctionComponent` annotation, and the type checker reports it.

## Change

The `Widget<T, S, F>` type in `@rjsf/utils` is now `SlotComponent<WidgetProps<T, S, F>>`, the slot type `Field` and every `TemplatesType` entry share: any function or class component taking those props, including one annotated as a React `ComponentType` or `FunctionComponent`.

It no longer carries the optional `MergedWidget` property, which `getWidget()` used to stamp onto a widget component to cache the wrapper it created for merging `defaultProps.options`. That caching is gone along with the merging (see [A widget component's defaultProps.options no longer reach its options](./widget-default-props-options-not-merged.md)). Remove any reference to `Widget['MergedWidget']`.

A `SlotComponent` doesn't satisfy a `ComponentType` annotation, so annotate such a value as `Widget`:

```diff
-const MyWidget: ComponentType<WidgetProps> = registry.widgets.TextWidget;
+const MyWidget: Widget = registry.widgets.TextWidget;
```

## Verify

- Your code compiles without `MergedWidget` references.
- Passing your own `ComponentType` into `widgets` is unaffected.
