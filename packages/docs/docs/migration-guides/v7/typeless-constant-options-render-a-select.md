---
title: 'A oneOf or anyOf of constants renders a select, with or without a type'
description: 'A `oneOf`/`anyOf` made only of constants used to render as an unsupported field without a `type`, and object or array constants as an object or array editor. All of them now render a select; check the data it writes.'
packages: ['@rjsf/core']
uses: [form]
schema: [any-of-one-of, enums, type-lists]
kind: runtime
noticed: review
related: [schema-with-anyof-and-oneof-reads-anyof-first, labelled-boolean-constant-options-default-to-a-select, typeless-falsy-const-writes-data-with-const-as-defaults-never, type-list-field-class-names-the-rendered-field]
---

## Detect

- In your schema: a `oneOf`/`anyOf` whose options are all `const` or single-value `enum`, with no `type`.
- In your schema: object or array constants, in a `oneOf`/`anyOf` or as an `enum` of a `type: 'object'`/`'array'`, such as `{ "type": "object", "enum": [{ "a": 1 }, { "a": 2 }] }`.
- In your schema: an `enum` or constant `oneOf`/`anyOf` whose `type` list names more than one non-`null` type.
- On the rendered page: a select where the form showed an unsupported field, an `ObjectField` with no control, or an `ArrayField` list editor.

## Change

`SchemaField` now infers the `type` from the constant values, so the select these schemas describe renders ([#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666)):

```json
{
  "oneOf": [
    { "const": "gpl", "title": "GPL" },
    { "const": "mit", "title": "MIT" }
  ]
}
```

Object and array constants render through a select whose options are labelled with their `title`, or with their JSON when they have none, whether the schema omits `type` or declares `object`/`array` ([#5317](https://github.com/rjsf-team/react-jsonschema-form/issues/5317)). They are given the type `object`/`array`, and a declared type is kept, so custom fields, templates and widgets see the type of the value they choose. `StringField` renders the select, as it renders every other select. A typed object or array with an empty `oneOf: []`/`anyOf: []` is still edited through `ObjectField`/`ArrayField`.

The data changes with it:

- `getDefaultFormState()` fills such a select as a whole, the way it fills a primitive select. A required `oneOf`/`anyOf` select defaults to the constant its own `default` names, or else its first, honoring `constAsDefaults` (including `skipOneOf`). A required `enum` select is left unfilled, and a picked value is kept. An ancestor's `default` naming one of its constants picks that one, and `ui:initialValue`/`ui:emptyValue` apply as they do to a primitive select. Both used to get an empty `{}`/`[]` that no option allows, and a picked object could be blended with the select's `default`.
- `omitExtraData()`, `sanitizeDataForNewSchema()` and the `ui:required` check treat the value as one constant. `omitExtraData`/`liveOmit` keep the picked object or array whole instead of pruning it to nothing, and switching to a schema whose select doesn't offer it clears it. Picking one sanitizes the data a condition on it controls, as picking a primitive option does.
- An array select offers the `radio` alias as well as `select` and `hidden`, and no longer `checkboxes` or `files`. A multi-select array still has no `radio`.
- A select whose `type` list names more than one non-`null` type renders through `StringField`, which keeps each option's value. It used to render the field for the first listed type, which was `NullField` for a list starting with `null`, and a list starting with `number` cast every option to a number, so a `true` option wrote `1`.

If a widget alias stops applying, switch the field to `select`, `radio` or `hidden`:

```diff
 const uiSchema = {
-  tags: { 'ui:widget': 'checkboxes' },
+  tags: { 'ui:widget': 'radio' },
 };
```

## Verify

- Each such field renders a select, labelled by its options' titles or JSON.
- The submitted data holds the picked constant whole, and a required select starts on its `default` or first option.
- Three narrower shapes have entries of their own: [a schema with both anyOf and oneOf](./schema-with-anyof-and-oneof-reads-anyof-first.md), [a boolean with labelled constant options](./labelled-boolean-constant-options-default-to-a-select.md) and [a typeless falsy const with constAsDefaults never](./typeless-falsy-const-writes-data-with-const-as-defaults-never.md).
