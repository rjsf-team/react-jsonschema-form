---
title: toFieldPathId(), the FieldPathId type and useDeepCompareMemo() are removed
description: '`@rjsf/utils` no longer exports `toFieldPathId`, the `FieldPathId` type or the `useDeepCompareMemo` hook. Build paths with `toFieldPath()`, derive ids and names from the `FieldPath`, and use React''s `useMemo()` instead of the hook.'
packages: ['@rjsf/utils']
uses: [utils-api, typescript]
schema: []
kind: removal
noticed: type-error
related: [fieldpathid-prop-is-fieldpath-and-id]
---

## Detect

- In your code: `toFieldPathId`, `FieldPathId` or `useDeepCompareMemo` imported from `@rjsf/utils`.
- The type checker reports `TS2724: '"@rjsf/utils"' has no exported member named 'toFieldPathId'. Did you mean 'toFieldPath'?`, the same with `'FieldPathId'` and `'FieldPath'`, or `TS2305: Module '"@rjsf/utils"' has no exported member 'useDeepCompareMemo'`.

## Change

Build paths with `toFieldPath(segment, parentPath?)` and derive what you need from the `FieldPath` it returns:

| Was                                    | Now                                               |
| -------------------------------------- | ------------------------------------------------- |
| `toFieldPathId(name, options, parent)` | `toFieldPath(name, parentFieldPath)`              |
| `fieldPathId.$id`                      | `id` prop, or `fieldPathToId(fieldPath, options)` |
| `fieldPathId.path`                     | `fieldPathToList(fieldPath)`                      |
| `fieldPathId.name`                     | `fieldPathToName(fieldPath, options, isMulti)`    |

Type a value you held as `FieldPathId` as `FieldPath` for the data address or `string` for the DOM id. `FieldPath` is a branded `string`, so a plain string such as a DOM id is rejected where a `FieldPath` is expected, and a `FieldPath` is accepted wherever a `string` is. The props that replace `fieldPathId` are covered in [Fields and templates receive fieldPath and id instead of a fieldPathId object](./fieldpathid-prop-is-fieldpath-and-id.md).

`useDeepCompareMemo()` existed to hand out a stable `fieldPathId` object across renders. With two primitive strings there is nothing to stabilize. A custom field or widget that used it for its own props can use `useMemo()`, or compare the values it cares about directly:

```diff
-import { useDeepCompareMemo } from '@rjsf/utils';
-const options = useDeepCompareMemo(props.options);
+import { useMemo } from 'react';
+const { enumOptions } = props.options;
+const options = useMemo(() => ({ enumOptions }), [enumOptions]);
```

## Verify

- The type checker reports no missing export, and no plain `string` passed where a `FieldPath` is expected.
- A component that used `useDeepCompareMemo()` re-renders only when the values it depends on change.
