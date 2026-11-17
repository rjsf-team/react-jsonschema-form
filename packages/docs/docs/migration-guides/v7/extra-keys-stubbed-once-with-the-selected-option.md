---
title: An object's extra keys render once beside its selected anyOf or oneOf option
description: An object whose `anyOf`/`oneOf` options render beside it used to stub its extra keys twice, once for itself and once in the option. They now render once, judged by the object and the selected option together; update tests and snapshots.
packages: ['@rjsf/core']
uses: [form]
schema: [additional-properties, any-of-one-of]
kind: runtime
noticed: test
related: [custom-objectfield-schema-must-be-retrieved, custom-anyof-oneof-field-uses-option-selection]
---

## Detect

- Your schema has an object with `additionalProperties`, `unevaluatedProperties` or `patternProperties` and `anyOf`/`oneOf` options beside it, or options that carry those keywords themselves.
- On the rendered page or in snapshots: extra key rows, add buttons or declared properties that rendered twice.

## Change

Such an object stubs the extra keys of its data once, for itself and the selected option together. A key the selected option declares is left to the option, which renders it. The object takes the option's `additionalProperties`, `unevaluatedProperties` and `patternProperties` beside its own: a key either describes is described by both, and a key either forbids is forbidden. The option's own field no longer stubs keys a second time. Where the selected option offers options of its own, the field it renders beside them takes the extra keys in the object's place, since only that field knows which of its options declares a key.

No code has to change. Update tests and snapshots; "before" is what 6.11.0 gives:

- `additionalProperties: { type: 'object', properties: { host: { type: 'string' }, port: { type: 'number' } } }` beside `anyOf: [{ patternProperties: { '^x-': { type: 'string' } } }]`, with the data `{ db: { host: 'h', port: 1 } }` ([#5462](https://github.com/rjsf-team/react-jsonschema-form/issues/5462)). Before: `db` rendered twice, as the object's `root_db_host` and `root_db_port` and as a second key row the option stubbed. After: once, with `root_db_host` and `root_db_port`.
- `properties: { name: { type: 'string' } }` beside `oneOf: [{ additionalProperties: { type: 'number' } }]`, with the data `{ name: 'n', k: 1 }`. Before: `root_name` rendered twice, the second time as a key row the option stubbed. After: once, with `k` as a number row and the add button beside it.
- `additionalProperties: true` beside `oneOf: [{ oneOf: [{ properties: { x: { type: 'string' } }, additionalProperties: { type: 'string' } }] }]`, with the data `{ x: 'a', extra: 'e' }`. Before: `x` and `extra` rendered twice, as the object's key rows and the nested option's, with an add button in each of the two object fields. After: once, in the nested option's field, with one add button.
- `additionalProperties: { type: 'string' }` beside `oneOf: [{ properties: { a: { type: 'string' } }, additionalProperties: false }]`, with the data `{ a: 'v', other: 'o' }`. Before: `root_a` rendered twice, once as a string row of the object, and `other` as a string row. After: `root_a` once, the option's, and `other` gets no field, since the option forbids it.
- `additionalProperties: { type: 'string' }` beside `anyOf: [{ properties: { count: { type: 'number' } } }, { properties: { count: { type: 'number' }, b: { type: 'string' } } }]`: add a property and rename `newKey` to `count` ([#5461](https://github.com/rjsf-team/react-jsonschema-form/issues/5461)). Before: the data was `{ count: 'New Value' }`, the string the add button wrote for a key the object describes, shown in the option's number field and in a second key row as well. After: the data is `{ count: 0 }`, seeded from the option's declaration, with `root_count` once.

The option is the one `SchemaField` shows. Where a `ui:field` with `ui:fieldReplacesAnyOrOneOf` keeps the options from rendering, the key is an extra key and the rename gives `{ count: 'New Value' }`, before and after.

## Verify

- Each extra key renders one row, with one add button per object.
- A key the selected option forbids gets no field.
