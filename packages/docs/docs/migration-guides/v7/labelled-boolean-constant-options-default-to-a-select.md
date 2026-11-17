---
title: 'A boolean with labelled constant options renders a select instead of a checkbox'
description: 'A `type: boolean` whose `oneOf`/`anyOf` has several constant options with a title, or a nullable boolean with a `null` constant, now defaults to a select. Set `ui:widget: checkbox` to keep the checkbox.'
packages: ['@rjsf/core']
uses: [form, markup]
schema: [enums, any-of-one-of]
kind: runtime
noticed: test
related: [typeless-constant-options-render-a-select, boolean-enum-values-labelled-yes-no]
---

## Detect

- In your schema: a `type: 'boolean'` whose `oneOf`/`anyOf` has more than one constant option, at least one labelled by its `title` or by a `ui:title` in the matching `uiSchema.oneOf`/`uiSchema.anyOf` entry.
- In your schema: a nullable boolean (`"type": ["boolean", "null"]`) whose options include a `null` constant, labelled or not.
- On the rendered page or in snapshots: a select where the field rendered a checkbox.

## Change

A checkbox shows no option labels, so such a boolean now defaults to a select, the same widget its typeless spelling gets ([#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309)):

```json
{
  "type": "boolean",
  "oneOf": [
    { "const": true, "title": "Yes" },
    { "const": false, "title": "No" }
  ]
}
```

A nullable boolean with a `null` constant gets the select too, since a checkbox has no state for `null`. A single option, the usual way to spell a checkbox that must be checked, and unlabelled `true`/`false` options keep the checkbox.

A custom field chosen by `ui:field` isn't handed that default: its `uiSchema` has no `ui:widget` unless the caller set one. `ui:field: 'BooleanField'` still gets the select, and so does a field registered under the schema's `$id`.

To keep the checkbox:

```diff
 const uiSchema = {
-  agree: {},
+  agree: { 'ui:widget': 'checkbox' },
 };
```

## Verify

- The field renders the widget you chose, and updated snapshots show the select where you kept it.
