---
title: getDefaultFormState internals and calculateIndexScore have no import path
description: The `getDefaultFormState()` internals and `calculateIndexScore()` under `@rjsf/utils/lib` can no longer be imported. Call `getDefaultFormState()` or `schemaUtils.getDefaultFormState()`, and `getClosestMatchingOption()` in place of `calculateIndexScore()`.
packages: ['@rjsf/utils']
uses: [utils-api]
schema: []
kind: removal
noticed: build
related: [deep-imports-removed]
---

## Detect

- `computeDefaults`, `getObjectDefaults`, `getArrayDefaults`, `getDefaultBasedOnSchemaType`, `AdditionalItemsHandling` or `calculateIndexScore` imported from `@rjsf/utils/lib` in your code.
- Your bundler fails to resolve that path, or Node throws `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Change

Call the public function that wraps them. For defaults, use `getDefaultFormState()` from `@rjsf/utils`, or `schemaUtils.getDefaultFormState()` from the registry. Both return the full default form state that the internals used to build piece by piece.

In place of `calculateIndexScore()`, call `getClosestMatchingOption()` from `@rjsf/utils`, which scores each option and returns the index of the best match. For the other paths that went away, see [imports from a package's lib folder no longer resolve](./deep-imports-removed.md).

## Verify

- No code imports from `@rjsf/utils/lib`.
- The defaults or option index your code computes match what it computed before.
