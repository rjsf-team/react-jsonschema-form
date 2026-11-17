---
title: A $ref cycle whose field renders hidden has no Expand button
description: A collapsed `$ref` cycle whose next field renders hidden used to show an Expand button that revealed a hidden field, and now renders nothing. Tests that clicked it read the field's value from the form data.
packages: ['@rjsf/core']
uses: [ui-schema, markup]
schema: [refs]
kind: markup
noticed: test
related: [hidden-property-left-out-in-antd-and-mantine, ref-cycle-expansion-uses-expand-ref-cycle]
---

## Detect

- Your recursive `$ref` schema hides the cycle's field through its own uiSchema or `ui:definitions` entry setting `ui:widget: 'hidden'`, or, under `deprecatedHandling: 'hide'`, through `deprecated` beside its `$ref` or where the `$ref` leads.
- Tests that click its `__expand` button.

## Change

`CyclicSchemaField` renders nothing in place of its Expand button for a `$ref` cycle whose field one level further renders hidden, since expanding it would show nothing, and `ObjectField` marks such a property `hidden`, expanded or not ([#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507)).

With this schema and `uiSchema: { child: { 'ui:widget': 'hidden' } }`, `#root_child__expand` used to render, and clicking it rendered a hidden field. Now neither renders.

```json
{
  "definitions": {
    "node": { "type": "object", "properties": { "child": { "$ref": "#/definitions/node" } } }
  },
  "$ref": "#/definitions/node"
}
```

A test that clicked the button to reach that field reads the field's value from the form data instead:

```diff
-await user.click(container.querySelector('#root_child__expand')!);
+expect(formRef.current?.getFormData()).toMatchObject({ child: expectedChild });
```

## Verify

- No Expand button renders for the hidden cycle.
