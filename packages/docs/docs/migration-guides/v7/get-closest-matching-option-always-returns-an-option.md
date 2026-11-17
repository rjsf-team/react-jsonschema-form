---
title: getClosestMatchingOption returns a valid option index whenever there are options
description: '`getClosestMatchingOption()` used to return `-1` or an out-of-range `selectedOption`, and now returns an option the data matches whenever one does and some option whenever there are options. Remove `-1` checks and expect the new tie-breaks.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: [any-of-one-of]
kind: runtime
noticed: test
related: [selected-option-stays-while-you-type, custom-validator-isvalid-must-not-change-data]
---

## Detect

- In your code: calls to `getClosestMatchingOption()` or `schemaUtils.getClosestMatchingOption()` whose result is compared with `-1`, or that pass a `selectedOption` past the end of the options.
- Tests that assert the index it returns for data that matches several options or none.

## Change

`getClosestMatchingOption()` returns an option the data matches whenever one does, and some option whenever there are options. A tie goes to the `selectedOption` only where the data matches it, or where no option matches the data, and to the first candidate otherwise. A `selectedOption` past the options is ignored. A property holding an `anyOf`/`oneOf` of its own adds the score of the option picked among those, plus one where the data matches it, where it used to add that option's index.

```ts
getClosestMatchingOption(context, rootSchema, undefined, [{ type: 'string' }, { type: 'number' }]);
// Before: -1. After: 0
getClosestMatchingOption(context, rootSchema, undefined, [{ type: 'string' }, { type: 'number' }], 2);
// Before: 2, an index past the options. After: 0
```

Drop any branch for `-1` when the options aren't empty, and update tests that assert the old index.

Within one call, a pick is reused without looking at the data again, so a validator's `isValid()` must not change the data; see [A custom validator's isValid must leave the data unchanged](./custom-validator-isvalid-must-not-change-data.md).

## Verify

- The index you get is always within the options you passed.
- Forms open on an option the data matches; see [An anyOf or oneOf field keeps the option the user selected](./selected-option-stays-while-you-type.md).
