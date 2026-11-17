---
title: Changed ids change the names a native form submits
description: A control's `name` is its id, so every control whose id changed in v7 posts under the new id and reading the v6 name returns `null`. Read the v7 names from `FormData` and on your server, or set a `nameGenerator`.
packages: ['@rjsf/core', '@rjsf/antd', '@rjsf/chakra-ui', '@rjsf/mantine', '@rjsf/mui']
uses: [form-props]
schema: []
kind: runtime
noticed: review
related: [ids-cant-collide-or-split-an-id-list]
---

## Detect

- In your code or tests: `FormData.get(…)`, `form.elements.namedItem(…)` or a `[name=…]` selector using a v6 id for a field whose property name the escaping changes, such as `root_first name`.
- The same for an `AltDateWidget` date part, a nested `anyOf`/`oneOf` option selector, or the key input of an additional property in `@rjsf/antd`, `@rjsf/chakra-ui`, `@rjsf/mantine` or `@rjsf/mui` (`root_foo-key` in v6).
- On your server: code reading those names from a native form post.
- Your `Form` sets no `nameGenerator`.

## Change

Every field's control takes its id as its `name`, unless the form sets a `nameGenerator`. A field whose property name holds whitespace or punctuation, begins or ends with `_`, holds `__` or `-_`, ends with `-`, or is `''` posts under its new id, so `FormData.get('root_first name')`, or server code reading the v6 name, gets `null`. A date part, a nested option selector and the key input in the themes listed above post under their new ids too. [Some rendered ids change so they cannot collide or split an id list](./ids-cant-collide-or-split-an-id-list.md) lists the new ids.

```diff
-formData.get('root_first name');
-formData.get('root_when_year');
+formData.get('root_first-_20name');
+formData.get('root_when__year');
```

## Verify

- A native submit of a form with those fields posts every value under the name your code or server reads.
- No lookup by `name` returns `null` for a field that is on the page.
