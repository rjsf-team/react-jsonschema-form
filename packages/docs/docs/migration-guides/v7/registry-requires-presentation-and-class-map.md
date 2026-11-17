---
title: A hand-built Registry needs presentation and classMap
description: 'The `Registry` type in `@rjsf/utils` has two new required members, `presentation` and `classMap`. Build the registry with `buildRegistry()` or `getTestRegistry()`, or add both members to your hand-built object.'
packages: ['@rjsf/utils']
uses: [typescript, custom-fields, custom-widgets, custom-templates]
schema: []
kind: type
noticed: type-error
related: [form-get-registry-is-build-registry, get-test-registry-moved-to-core-testing]
---

## Detect

- An object literal typed `Registry`, or passed as a `registry` prop, that your code or tests build by hand with no `presentation` or `classMap` key.
- Type checker: `Property 'presentation' is missing in type '{ fields: …; templates: …; widgets: …; … }' but required in type 'Registry<unknown, JSONSchema7, object>'.` (TS2741), or the same for `classMap`.

## Change

The `Registry` type has two new required members:

- `presentation` is the `MergedThemePresentation` that declares which parts of a field each registered field and widget draws itself. It merges `@rjsf/core`'s declarations, the theme's and the `Form`'s [`presentation`](../../api-reference/form-props.md#presentation) prop.
- `classMap` is the `MergedClassMap` of class names for the elements `@rjsf/core` renders, one key per element. It merges `@rjsf/core`'s defaults, the theme's `classMap` and the `Form`'s [`classMap`](../../api-reference/form-props.md#classmap) prop. Core's components read their classes from it, beside the `rjsf-` markers they always render.

Build the registry with `buildRegistry()` from `@rjsf/core` (see [Form.getRegistry is now the buildRegistry export](./form-get-registry-is-build-registry.md)) or `getTestRegistry()` from `@rjsf/core/testing` (see [getTestRegistry moved to @rjsf/core/testing](./get-test-registry-moved-to-core-testing.md)), which fill both in. `getTestRegistry()` takes the presentation as a new last argument and an optional `classMap` after it.

Or add them yourself. For `classMap`, give every key of `ClassMap`, leaving a key without a class `undefined` rather than `''`, which renders an empty `class` attribute. Where nothing reads it, an empty object cast to `MergedClassMap` is enough:

```diff
-import type { Registry } from '@rjsf/utils';
+import { mergeThemePresentation } from '@rjsf/utils';
+import type { MergedClassMap, Registry } from '@rjsf/utils';

 const registry: Registry = {
   fields,
   templates,
   widgets,
+  presentation: mergeThemePresentation(),
+  classMap: {} as MergedClassMap,
   // ...
 };
```

## Verify

The type checker accepts your registry literal. With every `classMap` key filled in, the rendered elements carry the classes you gave them and no empty `class` attribute.
