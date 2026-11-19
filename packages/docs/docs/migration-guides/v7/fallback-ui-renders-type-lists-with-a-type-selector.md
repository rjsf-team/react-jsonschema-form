---
title: The fallback UI renders type lists and unconstrained properties with a type selector
description: 'Under `useFallbackUiForUnsupportedType`, a `type` list and each `additionalProperties: true` key used to render one fixed type; they now render a type selector beside the field. Check those fields and update tests and snapshots.'
packages: ['@rjsf/core']
uses: [form-props, markup]
schema: [type-lists, additional-properties]
affects: [experience, appearance]
related: [type-list-starting-with-null-renders-its-first-other-type, untyped-additional-property-renders-its-constraints]
---

## Detect

- In your code, a `Form` that sets [useFallbackUiForUnsupportedType](../../api-reference/form-props.md#usefallbackuiforunsupportedtype).
- In your schema, a `type` list with more than one type other than `null`, or an object with `additionalProperties: true`:

```tsx
const schema: RJSFSchema = {
  type: 'object',
  properties: {
    // a selector offering exactly these three types
    multi: { type: ['string', 'number', 'boolean'] },
    // a selector offering every JSON Schema type, for each key added here
    anything: { type: 'object', additionalProperties: true },
  },
};

render(<Form schema={schema} validator={validator} useFallbackUiForUnsupportedType />, document.getElementById('app'));
```

- On the rendered page, these fields now show a type selector. v6 rendered the first listed type, or the type the data held, with no way to switch.

## Change

Both now render through `FallbackField`, which pairs a type selector with the field for the chosen type. Update tests and snapshots for the selector. Switching the type casts the current value where it can (a number to its string spelling, a string to the number it reads as) and starts from an empty value where it can't, such as an object, an array, or a number from text that reads as no number.

The selector now also offers `integer` and `null` beside the five types it offered in v6, and starts on the type the current form data has.

## Verify

- Every other keyword still describes the value, so `properties`, `items`, `format` or `minimum` apply to whichever type is chosen.
- A schema pairing a type list with an `anyOf` or `oneOf` whose options name no type gets both selectors: the type selector wraps the option selector. A list with an option naming its own type gets no selector around it, and each option in it naming no type renders a type selector of its own. The exception is a list mixing the two on a schema whose first type is `object`, or one naming only its own types on such a schema whose `ui:field` or `$id` names the fallback field.
- A nullable type such as `['string', 'null']` still renders a plain `string` field, since [getSchemaType()](../../api-reference/utility-functions.md#getschematype) resolves it to one type.
- A schema with an `enum`, a `const`, or an `anyOf`/`oneOf` of constants still renders its select or constant field with no type selector.
- A field whose `ui:widget` is a component renders that control alone, as one with a `ui:field` does. A `ui:widget` given as a string renders inside the selector and is dropped for a chosen type the theme has no widget for.
- A schema with no usable type of its own, such as an unrecognized `type` or an unconstrained `additionalProperties` entry, still gets a selector. A list naming an unrecognized type beside recognized ones offers only the recognized ones, so `['foo', 'null']` offers only `null`.
- With the prop off, a type list renders one field: see [A type list renders the first type other than null that JSON Schema defines](./type-list-starting-with-null-renders-its-first-other-type.md). See [Multiple types](../../json-schema/single.md#multiple-types) for details.
