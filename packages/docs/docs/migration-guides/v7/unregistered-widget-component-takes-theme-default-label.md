---
title: A widget component given to ui:widget without a registry key gets the theme's default label plan
description: An unregistered component passed to `ui:widget` now takes its label placement from the theme's `default` declaration, so it can render two labels or none. Register it under a key and declare it in `presentation`.
packages: ['@rjsf/core']
uses: [custom-widgets]
schema: []
kind: runtime
noticed: review
related: [boolean-widget-in-ui-options-gets-its-label, mantine-custom-widgets-draw-errors-by-their-key, widget-reads-the-presentation-plan]
---

## Detect

- In your `uiSchema`, `ui:widget` set to a component rather than a string, where that component is not in the `widgets` you pass.
- On the rendered page, such a field shows its label twice, or has no label.

## Change

`SchemaField` no longer asks `getDisplayLabel()` whether a field's own widget draws its label. It looks the widget up by its alias, the key it is registered under or the component itself, and draws the label where that widget's declaration, from the theme or the `Form`'s [`presentation`](../../api-reference/form-props.md#presentation) prop, says ([#5389](https://github.com/rjsf-team/react-jsonschema-form/issues/5389)). A self-labelling widget registered under another key and declared `label: 'self'` draws one label however `ui:widget` names it.

A component registered under no key has no declaration of its own and is planned by the theme's `default`:

- Where that `default` leaves the label to the template, as in `@rjsf/core`, `@rjsf/antd`, `@rjsf/daisyui`, `@rjsf/react-bootstrap` and `@rjsf/shadcn`, a component that draws its own label anyway, ignoring both its `presentation` and `hideLabel`, renders a label twice.
- Where it has the widget draw the label, as in `@rjsf/chakra-ui`, `@rjsf/fluentui-rc`, `@rjsf/mantine` and `@rjsf/mui`, a component that draws no label renders none.

Register the component under a key and declare it in `presentation` to give it one label:

```diff
-const uiSchema = { rating: { 'ui:widget': StarsWidget } };
+const widgets = { StarsWidget };
+const presentation = { widgets: { StarsWidget: { label: 'self' } } };
+const uiSchema = { rating: { 'ui:widget': 'StarsWidget' } };
+<Form widgets={widgets} presentation={presentation} uiSchema={uiSchema} ... />;
```

How a widget reads its plan is in [A custom widget reads its label, description and required marker from the plan](./widget-reads-the-presentation-plan.md).

## Verify

Each field drawn by your component shows exactly one label, in every theme you use.
