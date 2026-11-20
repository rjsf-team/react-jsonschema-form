---
title: 'A custom WrapIfAdditionalTemplate takes its key value from keyName'
description: 'A `WrapIfAdditionalTemplate` that fills its key input from `label` shows decorations such as `foo (deprecated)` and renames the key to them on blur. Use the new `keyName` prop as the input value and keep `label` for its label.'
packages: ['@rjsf/core']
uses: [custom-templates]
schema: [additional-properties]
affects: [code]
related: [field-template-props-requires-key-name]
---

## Detect

- In your code: a custom `WrapIfAdditionalTemplate` whose key input uses `label` as its `defaultValue`.
- On the rendered page: a `deprecated` additional property keyed `foo` shows `foo (deprecated)` in its key input and renames itself to that string on blur, or a key with a `ui:title` shows the title.

## Change

Take the key input's value from `keyName`, and keep `label` for the input's own label:

```diff
 const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
-<input type='text' id={additionalKeyId(id)} onBlur={onKeyRenameBlur} defaultValue={label} />;
+<input type='text' id={additionalKeyId(id)} onBlur={onKeyRenameBlur} defaultValue={keyName} />;
```

## Verify

- The key input shows the real key, and blurring it without edits leaves the key unchanged.
