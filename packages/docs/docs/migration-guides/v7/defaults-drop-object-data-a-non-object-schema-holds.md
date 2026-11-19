---
title: Defaults drop object data held by a field whose schema doesn't allow an object
description: '`getDefaultFormState()` used to keep object data under a field whose type leaves out `object`, or a select''s unmatched object; it now drops it and fills the field''s defaults. Add the value to the options or give the field a `default`.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, utils-api]
schema: [defaults, enums]
affects: [data]
related: []
---

## Detect

- In your form data, an object under a field whose schema `type` leaves out `object`, such as `{ type: 'string' }` or `{ type: 'array' }`, at any depth.
- In your schema, a select over object constants, or a `type: 'string'` select whose `enum` holds objects, where the data holds an object none of the constants match.
- In your code, a direct call to `getDefaultFormState()` that relied on such data passing through.

## Change

`getDefaultFormState()` now drops that object data and gives the field its defaults, as if the data lacked it. Object data means a plain object with no primitive value of its own, so a `Date`, or an object whose `valueOf()` gives an epoch, is kept. The items of array data keep it.

Inside object data, a select whose data is none of its constants takes its `default`, and with no `default` its key is left out:

```tsx
const schema: RJSFSchema = {
  type: 'object',
  properties: { p: { type: 'object', enum: [{ a: 1 }, { a: 2 }] } },
};
// formData { p: { a: 3 } }
// v6: { p: { a: 3 } }
// v7: {}
```

To keep such a value, add it to the options. To replace it, give the select a `default` ([#5522](https://github.com/rjsf-team/react-jsonschema-form/issues/5522)).

## Verify

- Fields whose data didn't fit their type start from their defaults.
- A select over object constants shows a value from its options, or no key at all.
