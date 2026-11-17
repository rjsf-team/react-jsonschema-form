---
title: RatingWidget stars run from minimum to maximum
description: "`RatingWidget` used to read `maximum` as a star count and ignore `stars`; it now draws stars from `minimum` to `maximum`, at most `stars` of them. Set the bounds to the values you want drawn and drop a smaller `stars` option."
packages: ['@rjsf/core', '@rjsf/daisyui']
uses: [ui-schema]
schema: [numbers]
kind: runtime
noticed: review
related: []
---

## Detect

- Your schema has a `number` or `integer` field rendered with `ui:widget: 'rating'` that sets `maximum`, or sets `minimum` with a `stars` option.
- This applies to `@rjsf/core`'s `RatingWidget`, which every theme but daisyui renders, and to `@rjsf/daisyui`'s own copy.

## Change

`maximum` is now the last value a star can have, and `stars`, still 5 by default and at most 5, is the most stars drawn. Fields like these draw different stars:

| Schema and options                   | Stars before  | Stars now  |
| ------------------------------------ | ------------- | ---------- |
| `maximum: 3`                         | 0, 1, 2       | 0, 1, 2, 3 |
| `minimum: 3, maximum: 5`             | 3, 4, 5, 6, 7 | 3, 4, 5    |
| `maximum: 0`                         | 0, 1, 2, 3, 4 | 0          |
| `minimum: 1, maximum: 5`, `stars: 3` | 1, 2, 3, 4, 5 | 1, 2, 3    |

To keep the stars you had, set the bounds to the values you want drawn, and drop a `stars` option smaller than the range:

```diff
- { type: 'integer', maximum: 3 }
+ { type: 'integer', minimum: 0, maximum: 2 }
```

```diff
- 'ui:options': { stars: 3 },
```

For `maximum: 3`, lowering the bound also rejects a stored 3. To keep that value valid, leave the schema as it is and cap the stars instead:

```diff
+ 'ui:options': { stars: 3 },
```

## Verify

- The rendered rating draws the same star values as before, and stored values still validate.
