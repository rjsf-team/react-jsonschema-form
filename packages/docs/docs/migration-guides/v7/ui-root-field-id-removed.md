---
title: The ui:rootFieldId uiSchema key is removed
description: "The deprecated `ui:rootFieldId` uiSchema key has been removed. Pass the `idPrefix` prop to `Form` instead."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema]
schema: []
kind: removal
noticed: review
related: []
---

## Detect

- Your uiSchema sets `ui:rootFieldId`. The type checker accepts the key, even on a typed `UiSchema`, but the rendered ids no longer use it.

## Change

`UiSchema['ui:rootFieldId']`, deprecated in a prior release, has been removed. Use the `Form.idPrefix` prop instead:

```diff
-<Form schema={schema} uiSchema={{ 'ui:rootFieldId': 'myform' }} validator={validator} />
+<Form schema={schema} idPrefix='myform' validator={validator} />
```

## Verify

- The rendered field ids start with your prefix.
