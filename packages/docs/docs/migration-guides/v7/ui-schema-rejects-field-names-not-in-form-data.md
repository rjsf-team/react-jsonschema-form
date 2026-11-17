---
title: A typed UiSchema rejects field names the form data lacks
description: "`UiSchema<T>` used to accept any string key and now only accepts the fields of `T`, plus typed `additionalProperties`, `additionalItems`, `anyOf`, `oneOf` and `classNames`. Declare missing fields in `T` or fix the misplaced entries."
packages: ['@rjsf/utils']
uses: [typescript, ui-schema]
schema: []
kind: type
noticed: type-error
related: [ui-schema-record-data-rejects-ui-keys, ui-schema-field-named-classnames-anyof-oneof, ui-schema-recursive-type-exceeds-stack-depth, ui-schema-entries-are-unknown]
---

## Detect

- Your code types a uiSchema as `UiSchema<T>`, or passes a uiSchema literal to a `Form` with typed `formData`. `FormProps` infers `T` from `formData`, so the check applies without naming the type anywhere.
- The type checker reports an entry whose name is not a field of `T`, such as a property a `dependencies` subschema adds, or an `additionalProperties` key when `T` has no index signature.
- The type checker reports an object where a positional list is expected, such as `oneOf: { 'ui:title': '...' }`. That object was already ignored at runtime with a console warning.
- The type checker rejects a uiSchema typed by an `interface` you declared. An interface has no index signature, and `UiSchema` requires one for its `ui:` keys. The `ui:${string}` signature predates v7, but field name checking makes this easier to hit.

## Change

`UiSchema<T>` used to intersect `GenericObjectType` (`Record<string, any>`). Its per-field entries are now a mapped type over `T`:

```ts
type FormData = { firstName: string; address: { city: string } };

const uiSchema: UiSchema<FormData> = {
  firstName: { 'ui:widget': 'textarea' },
  address: { city: { 'ui:placeholder': 'City' } },
  lastName: { 'ui:widget': 'text' }, // error: `lastName` is not a field of FormData
};
```

For a field that is absent from `T`, declare it in `T`, as an optional property where it isn't always there, or nest its entry under the `additionalProperties` key. An index signature of `unknown` values (`{ [key: string]: unknown }` on the relevant object) also compiles, but it turns off checking of that object's entries, declared fields included, so a typo such as `name: { 'ui:wigdet': 'textarea' }` is no longer caught.

Keys the old index signature accepted silently now have types:

- `additionalProperties` holds a uiSchema for the data the index signature of `T` holds, or for `unknown` data when `T` has none.
- `additionalItems` holds a uiSchema for the array's element type.
- `anyOf` and `oneOf` are positional lists, one uiSchema per subschema.
- The legacy unprefixed `classNames` is a string. `ui:classNames` is the prefixed spelling of the same thing.

```diff
- oneOf: { 'ui:title': 'Choice' },
+ oneOf: [{ 'ui:title': 'First choice' }, { 'ui:title': 'Second choice' }],
```

For an interface, use a `type` alias, or annotate the literal with `UiSchema<T>` directly:

```diff
- interface MyUiSchema { firstName: UiSchema }
+ type MyUiSchema = { firstName: UiSchema };
```

## Verify

- The uiSchema compiles, and a misspelled field name is reported.
- Untyped uiSchemas are unchanged. `UiSchema` with no type argument, or with `any` form data, accepts the same keys as before, arbitrary nesting included. Reading entries back from one gives `unknown`; see [Entries read from an untyped UiSchema are unknown](./ui-schema-entries-are-unknown.md).
- Any `ui:` key is still accepted at every level, so theme and application directives keep working. The exception is Record data, covered in [A uiSchema for Record data rejects ui: keys](./ui-schema-record-data-rejects-ui-keys.md).
- A union-typed field accepts the keys of every branch, since which branch is present depends on the current value.
- A field named `classNames`, `anyOf` or `oneOf` can't take an entry; see [A field named classNames, anyOf or oneOf takes no per-field uiSchema entry](./ui-schema-field-named-classnames-anyof-oneof.md).
- A deep uiSchema for a recursive data type can exhaust the checker; see [A deep uiSchema for a recursive form data type can exhaust the type checker](./ui-schema-recursive-type-exceeds-stack-depth.md).
