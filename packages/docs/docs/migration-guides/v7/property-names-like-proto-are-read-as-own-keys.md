---
title: Property names such as __proto__ and toString are read as own keys
description: The `@rjsf/utils` path and property helpers used to read inherited `Object.prototype` members and refuse `__proto__`; they now read and write own keys only. Check where a `ui:order` now places a `__proto__` key, and copy `setByPath()` results with spread.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [utils-api, ui-schema]
schema: [additional-properties]
kind: runtime
noticed: review
related: [options-list-returns-undefined-for-non-constant-options, incomplete-ui-order-renders-the-object]
---

## Detect

- In your schema or data, a property named `__proto__`, or named like an `Object.prototype` member such as `toString` or `constructor`.
- In your `uiSchema`, a `ui:order` on an object that can hold a `__proto__` key. On the rendered page, that object now shows the key, which it used to leave out.
- In your code, a `setByPath()` call whose path comes from user input, such as a typed key or a dotted path from a URL, whose result you copy with `Object.assign()`, a `target[key] = source[key]` loop or a recursive merge.
- In your code, a `transformErrors` that points an error at `.__proto__`.

## Change

These functions now match property names by own key ([#5561](https://github.com/rjsf-team/react-jsonschema-form/issues/5561)):

- `getPropertySchema()` returns `{}` for a property like `toString` that the schema doesn't declare, instead of the inherited function.
- `optionsList()` reads a selector property by own key, so an option that doesn't declare one named like `toString` is read by its constant.
- `orderProperties()` places a `__proto__` property, declared or held under `additionalProperties`, at the `ui:order` wildcard, where it used to be left out. An order without a wildcard renders it after the properties it lists, as [An incomplete ui:order renders the object instead of an error](./incomplete-ui-order-renders-the-object.md) describes. A name like `toString` that the order lists and the properties don't is dropped.
- `setByPath()` writes a `__proto__` segment, in any position, as an own key through [`setOwn()`](../../api-reference/utility-functions.md#setown), where the write used to be dropped. The write never reaches the prototype setter, but your own copy of the result can.
- `toErrorSchema()` and `ErrorSchemaBuilder` write through `setByPath()`, so an error at a path through `__proto__` is filed under that key, and a `transformErrors` that points an error at `.__proto__` reaches that field.

List `__proto__` in an order, or add a `*`, to choose where such a key renders:

```diff
-'ui:order': ['name', 'email'],
+'ui:order': ['name', '*', 'email'],
```

Copy a `setByPath()` result built from user input with spread or `setOwn()`, or leave `__proto__` out of the path:

```diff
-Object.assign(target, result);
+target = { ...target, ...result };
```

## Verify

- Objects holding a `__proto__` key show it where your `ui:order` places it.
- Your copies of `setByPath()` results don't change any object's prototype.
- Under `additionalProperties: false`, AJV doesn't count a declared `__proto__` property among the declared ones, so a value written to it fails validation as an additional property.
