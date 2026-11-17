---
title: A typed ErrorSchema matches the tree RJSF builds
description: '`ErrorSchema<T>` and `FormValidation<T>` used to resolve to the wrong shape for leaves, arrays and `any`, so typed error schemas needed casts. Drop the casts, annotate the value as `ErrorSchema<T>` and key array items by index.'
packages: ['@rjsf/utils']
uses: [typescript, form-props]
schema: []
kind: type
noticed: type-error
related: [form-validation-nodes-are-optional, error-schema-array-items-keyed-by-index]
---

## Detect

- In your code: a cast on an error schema, such as `as unknown as ErrorSchema`, added to get past the old types.
- In your code: an `ErrorSchema<T>` literal that holds an array for the items of an array field, such as `{ tags: [{ __errors: [...] }] }`. The type checker reports `TS2322: Type '{ __errors: string[]; }[]' is not assignable to type 'ErrorTree<string[], FieldErrors>'`.

## Change

`ErrorSchema<T>` and `FormValidation<T>` now describe the tree that `toErrorSchema()` and `createErrorHandler()` build. They used to resolve to the wrong shape for anything but a plain object: a leaf field's node resolved to that field's own type, an array's node to an array, and `ErrorSchema<any>` to an index signature no concrete error schema was assignable to. A typed error schema never type-checked.

Drop the casts. The value type-checks on its own now:

```diff
-const extraErrors = { name: { __errors: ['too short'] } } as unknown as ErrorSchema;
+const extraErrors: ErrorSchema<FormData> = { name: { __errors: ['too short'] } };
```

Key the items of an array field by index. An array field's node is never an array, which the old numeric index signature let through:

```diff
-const extraErrors: ErrorSchema<FormData> = { tags: [{ __errors: ['not allowed'] }] };
+const extraErrors: ErrorSchema<FormData> = { tags: { 0: { __errors: ['not allowed'] } } };
```

At runtime RJSF also handles an array of item errors as the index-keyed object; see [An array of item errors is keyed by index](./error-schema-array-items-keyed-by-index.md). Every node is optional, so reaching into one needs `?.`; see [Every node of FormValidation and ErrorSchema is optional](./form-validation-nodes-are-optional.md).

This is the shape a typed error schema accepts, with a node per field, keyed by index for arrays, and no children below a leaf:

```ts
type FormData = { name: string; address?: { city: string }; tags: string[] };

const errors: ErrorSchema<FormData> = {
  __errors: ['form-level problem'],
  name: { __errors: ['too short'] },
  address: { city: { __errors: ['unknown city'] } },
  tags: { 0: { __errors: ['not allowed'] } },
};
```

A field whose type is a union, which a `oneOf`/`anyOf` property gives you, accepts the children of every member it can hold, since which one is present depends on the current value:

```ts
type FormData = { thing: string | { city: string } };

const errors: ErrorSchema<FormData> = { thing: { city: { __errors: ['unknown city'] } } };
```

The type of the data a node describes decides which children it accepts:

| Field's type                                | Children of its error node                                       |
| ------------------------------------------- | ---------------------------------------------------------------- |
| An object                                   | A node per property                                              |
| An array                                    | A node per index, keyed as `0`, `1`, …                           |
| A tuple                                     | A node per position, each of that position's own type            |
| A tuple with a rest element                 | A node per declared position, then a node per index for the rest |
| A primitive (`string`, `number`, `boolean`) | None; a leaf holds only `__errors`                               |
| `Date` or `File`                            | None; an object holding no form fields                           |
| A union                                     | The children of every member                                     |
| `any` or `unknown`                          | Unconstrained                                                    |

An optional property is described by the type it holds, so `address?: { city: string }` gets the same node as `address: { city: string }`. Any other class instance used as a field value (a `Money` or `LatLng` value object, say) is treated as an object, so its properties are accepted as children even though nothing produces errors for them.

If you leave `T` at its default (`unknown`) and never annotate an error schema, nothing changes for you.

## Verify

- Your error schema literals type-check without casts.
- A field typed as a union of an array and an object with its own `length` field, such as `{ length: number } | string[]`, still accepts an array as its node, since that `length` field can hold errors.
- An array field's node rejects an array through a `length` key that can hold nothing, so that key shows through: `keyof` of such a node includes `length`, editors offer it in autocompletion, and `Required<>` of the node asks for a `length` no value can supply.
