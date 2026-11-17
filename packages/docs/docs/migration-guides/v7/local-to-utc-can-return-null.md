---
title: localToUTC can return null
description: '`localToUTC()` now takes `unknown` and is typed to return `string | null | undefined`, where it was inferred as `string | undefined`. Map `null` to the value you store, for example with `?? undefined`.'
packages: ['@rjsf/utils']
uses: [utils-api, typescript]
schema: [dates]
kind: type
noticed: type-error
related: []
---

## Detect

- Your code calls `localToUTC()` from `@rjsf/utils` and assigns the result to a `string | undefined`.
- The type checker reports `Type 'string | null | undefined' is not assignable to type 'string | undefined'.`

## Change

`null` isn't a new result. `localToUTC()` has always returned it for a value `Date` can't read, since `toJSON()` gives `null` for an invalid date though its type says `string`. Map `null` to the value it should store:

```diff
-const utc: string | undefined = localToUTC(value);
+const utc: string | undefined = localToUTC(value) ?? undefined;
```

## Verify

- Your code compiles.
- A value `Date` throws for, such as a bigint or a symbol, now gives `null` instead of throwing, so code that caught that error no longer sees it.
