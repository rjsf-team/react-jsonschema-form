---
title: Live validation and liveOmit run once per edit
description: 'Live validation and `liveOmit` now run for every edit, where v6 validated a run of queued edits once. Make edits that belong together as one `setFieldValue()` call that replaces the whole value.'
packages: ['@rjsf/core']
uses: [form-ref, form-props]
schema: []
affects: [data, experience]
related: []
---

## Detect

- Several `setFieldValue()` calls in one event in your code, on a form that sets `liveValidate` or `liveOmit`.
- Errors that show for a moment between those edits, or data that `liveOmit` drops after the first edit, on the rendered page.

## Change

Live validation and `liveOmit` now run for every edit, where the v6 class validated a run of queued edits once. Several edits in one event still build on each other: each one reads the form's current value, so a second `setFieldValue()` keeps the first one's change. When the edits are one operation, replace the whole value in one call, so they are validated together:

```diff
-formRef.current.setFieldValue('city', 'Paris');
-formRef.current.setFieldValue('country', 'France');
+const data = formRef.current.getFormData();
+formRef.current.setFieldValue('', { ...data, city: 'Paris', country: 'France' });
```

## Verify

- The combined edit is validated once, with no error from the state between the edits.
- The resulting data keeps every field the edits set.
