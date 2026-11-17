---
title: Null, untitled, fallback, extra-key and layout grid fields draw their labels differently
description: '`null`, untitled and fallback UI fields, titled array items, deprecated fields, `additionalProperties` keys and layout grid unions now label themselves differently. Update tests and snapshots, and hide a grid cell''s new label with `ui:label: false`.'
packages: ['@rjsf/core']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [label-and-title-ids-move-to-spans]
---

## Detect

- `type: 'null'` in your schema, or a custom `UnsupportedFieldTemplate` in your code, and a test or snapshot holding a `<label>` for such a field that names no control.
- `useFallbackUiForUnsupportedType` set on your `<Form>`, and tests or snapshots of the fields it renders.
- An array whose `items` schema has a `title`, and tests that find its items by the numbered title, such as `Tags-1`.
- A field with `deprecated: true` whose widget draws its label.
- A required field with no `title`, such as an untitled array item, and a snapshot holding a `<label>` with only the `*`.
- `additionalProperties` in your schema with boolean entries or `ui:label: false` on the entries, and tests that find a key input with no name.
- A cell of your `ui:layoutGrid` naming a property whose schema has `type: 'object'` beside `oneOf` or `anyOf`.

## Change

Update the tests and snapshots that match these labels:

- `null` fields, and a field rendered through `UnsupportedFieldTemplate`, draw their own title and description through `TitleFieldTemplate` and `DescriptionFieldTemplate`, where they drew a label naming no control. A custom `TitleFieldTemplate` or `DescriptionFieldTemplate` now renders for them too.
- The fallback UI labels its value from outside only where the value is a single control. An object, an array or a checkbox value draws its own heading or label, with the field's description beneath it, as before.
- Labels a widget draws take the field's label as the template's does. An array item whose `items` schema has a `title` is labelled by it instead of by the numbered title (`Tags-1`), and a deprecated field's label carries the `DeprecatedLabel` marker.
- An untitled field has no label, so a required array item with no title no longer renders a label holding only the required marker. The input is still `required`.
- An `additionalProperties` entry's key input is labelled wherever the entry's value is, whoever draws that label, so a checkbox entry's key is now labelled too. Where `ui:label: false` hides that label, the key input is named by it through `aria-label`. An object or array entry's heading shows its `ui:title`, or its schema `title`, where it has one, as before.
- A discriminated union a `LayoutGridField` lays out draws its label whatever its schema's `type`, as one with no `type` already did. One declaring `type: 'object'` beside its `oneOf` drew none and left its selector unnamed. Set `ui:label: false` on the cell to hide the label; the selector is still named by its text.

[Title and label ids move to a span](./label-and-title-ids-move-to-spans.md) covers the ids these labels carry.

## Verify

- A `null` field's title renders as a heading, with no `<label>`.
- An array item's widget is labelled with the `items` title, and a deprecated field's widget label shows the deprecated marker.
- Every `additionalProperties` key input has an accessible name, a boolean entry's included.
- A layout grid union's selector has an accessible name, and with `ui:label: false` no label shows above it.
