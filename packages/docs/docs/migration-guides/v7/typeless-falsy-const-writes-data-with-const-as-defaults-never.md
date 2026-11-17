---
title: 'A typeless falsy const writes its value with constAsDefaults never'
description: 'A typeless `{ "const": null }` used to render as unsupported and now renders `NullField`; with `constAsDefaults: never` it and a required typeless `{ "const": false }` now write their value on mount. Drop the property if the key must stay absent.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-props]
schema: [enums, defaults, type-lists]
kind: runtime
noticed: review
related: [typeless-constant-options-render-a-select]
---

## Detect

- In your `Form` props: `defaultFormStateBehavior.constAsDefaults` set to `'never'`.
- In your schema: a property with no `type` and `"const": null`, or a required one with `"const": false`.
- In your data: that key now holds `null` or `false` on mount where it was absent.

## Change

`getSchemaType()` returned `undefined` for a typeless schema whose `const` was falsy (`0`, `false`, `''` or `null`), which rendered those as unsupported fields. A typeless `{ "const": null }` now resolves to `null` and renders through `NullField`, like an explicit `{ "type": "null" }`.

At the default `constAsDefaults` nothing changes in the data, since such a property already contributed its constant as its default. With `'never'`, a typeless `{ "const": null }` and a required typeless `{ "const": false }` now write `null` and `false` on mount. The first is the `null` default the form fills in for a `type: 'null'` value, and the second the required-boolean default. Each matches what the explicit `type` spelling already did. Required `{ "const": 0 }` and `{ "const": "" }` are unaffected.

If your form relied on those keys staying absent, drop the property from the schema:

```diff
 "properties": {
-  "placeholder": { "const": null },
   "name": { "type": "string" }
 }
```

## Verify

- The data on mount holds exactly the keys you expect, and the typeless and explicitly typed spellings agree.
