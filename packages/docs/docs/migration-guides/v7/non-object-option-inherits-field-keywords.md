---
title: A non-object field's anyOf or oneOf option renders with its parent's keywords
description: The option of a non-object field used to inherit only `type` and `required`, and now inherits every value keyword such as `format`, `enum`, `items` and bounds. Check how those fields render, switch and default, and remove keywords you only meant for the field.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [any-of-one-of, arrays, type-lists]
affects: [data, appearance]
related: [any-of-one-of-field-labelled-once-by-its-template, draft-04-boolean-exclusive-bounds-unsupported-in-options]
---

## Detect

- Your schema has a field that is not an object, such as a string or an array, with `anyOf`/`oneOf` options and keywords beside them such as `format`, `enum`, `examples`, `readOnly`, `items`, `maxItems` or `minimum`.
- Your schema has a `type` list naming `object`, such as `['object', 'string']` or a nullable `['object', 'null']`, with an option of another type.
- On the rendered page, such a field now renders a different widget, such as a date input or a multi-select.

## Change

A field with `anyOf`/`oneOf` options is rendered entirely by its selected option, unless it is an object, whose own `ObjectField` renders its properties beside the option. A `type` list naming `object` counts as an object only while the option shown can hold one, so an option of another type, a `null` option included, renders the whole field wherever `object` sits in the list ([#5725](https://github.com/rjsf-team/react-jsonschema-form/issues/5725)).

The option used to inherit only the field's `required` list and `type` ([#5359](https://github.com/rjsf-team/react-jsonschema-form/issues/5359)). It now inherits every keyword of the field that describes its value. So this schema, which rendered "Unsupported field schema ... Missing items definition.", now renders a multi-select, and a `format: 'date'` string with options now renders a date input:

```json
{
  "type": "array",
  "items": { "type": "string", "enum": ["a", "b"] },
  "uniqueItems": true,
  "oneOf": [{ "minItems": 1 }, { "maxItems": 1 }]
}
```

Where both the field and the option declare a keyword, the merge works like this:

- A bound both declare, such as `maxItems`, `maxLength` or `minimum`, keeps the stricter of the two: an option's `maxItems: 5` beside the field's `maxItems: 3` stops Add at three items, and switching to that option trims the array to three.
- An option's `true` subschema, such as `items: true`, leaves the field's subschema in place, a tuple included. A field's `false` subschema stays in place of the option's.
- An option's `items` schema beside the field's tuple applies to each of its positions, and to the items past it where the tuple declares `additionalItems`. A tuple declaring none stays at its length, and so does an option's tuple beside the field's `items` schema.
- An `enum` the option declares is its own list as it stands, since its `ui:enumNames` are read by position against it. A value the field's `enum` doesn't list stays, and validation rejects it.
- Two `required` lists ask for every name either does.
- A `not`, or a conditional (`if`, `then` and `else` together), that the option declares replaces the field's as a whole.
- Any other keyword both declare, such as a `format` or a `pattern`, is the option's.
- A subschema either declares through a `$ref`, such as `items: { "$ref": "#/$defs/short" }`, is left to the field's `allOf` merge, which meets the two once the `$ref` is resolved.

The field's `title`, `description`, `deprecated` and `default` stay with the field. Its own template labels it whichever option is selected; see [An anyOf or oneOf field is labelled once by its own template](./any-of-one-of-field-labelled-once-by-its-template.md).

Remove a keyword from the field, or move it into the options, where you didn't mean every option to have it. Bounds use the draft-06 numeric form; see [Draft-04 boolean exclusiveMinimum and exclusiveMaximum](./draft-04-boolean-exclusive-bounds-unsupported-in-options.md).

## Verify

- Switching options checks the value against the option as it renders, inherited keywords included, so an array whose options only limit its length keeps its items where it used to be cleared.
- A value that is neither an array nor an object, such as a string, is still cleared by every switch, even between two options that both describe it.
- A tuple keeps its items, each sanitized against the schema the selected option declares at its position, unless the selected option gives a prefix position a type that leaves out one the other option gave it, which clears the array. An item past them is dropped.
- An array the selected option has a `const` for is replaced with that `const` when it doesn't equal it, and one an option's `enum` of whole arrays doesn't list is cleared, unless the option switched away from declared the same `const` or `enum`.
- Where both options render the items alike, with the same uiSchema and a field per item, and the switch keeps the array's length, an item field's own errors stay with the item. An option that is a select over whole arrays, or one holding options of its own, drops them on a switch.
- `ui:required` is checked against the option as it renders: a `ui:required` field within the field's `items` is checked where an option's `items: true` leaves them in place, and one the field's `false` subschema forbids is not.
- Defaults are computed from the option as it renders. An option's `minItems: 1` beside the field's `minItems: 2` starts the form with two items, each holding the defaults of the field's `items`, whether the option is written in place or as a `$ref`, and a tuple's options add to the defaults of its positions.
- An option written as a `$ref` is followed only to the schema it names, so an `allOf` within it is still left to the `allOf` defaults behavior. One that inherits nothing from the field, such as the option of a typeless field, takes the field's `default` only when there is no data. One that inherits something takes the field's `default` beneath its data and its own `default`.
- A non-object field declaring both `anyOf` and `oneOf` renders only the `anyOf` option unless the `anyOf` is empty, so its defaults are that option's alone, where they used to include those of the selected `oneOf` option. An object field still adds both.
- An object that names no `type` but has `properties` now passes `object` on to options that name no type either, so they render as a typed object's options do where they rendered "Unsupported field schema ... Unknown field type undefined."
