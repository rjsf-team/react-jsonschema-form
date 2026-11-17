---
title: 'A numeric field can hold a string in formData while it is edited'
description: 'A native number input reported an unparseable value as empty; the text input now leaves strings such as `1.2.3` or `-` in `formData`. Check the type before using a numeric field value from `onChange`, `getFormData()` or live errors.'
packages: ['@rjsf/core', '@rjsf/bootstrap3', '@rjsf/chakra-ui', '@rjsf/daisyui', '@rjsf/fluentui-rc', '@rjsf/mui', '@rjsf/react-bootstrap', '@rjsf/shadcn']
uses: [form-props, form-ref]
schema: [numbers]
kind: runtime
noticed: review
related: [number-fields-render-text-input]
---

## Detect

- In your `onChange` handler, a `getFormData()` call or code reacting to `liveValidate` errors: arithmetic or formatting on a `number`/`integer` field's value without a `typeof` check.
- On the rendered page: typing `1.2.3` or a lone `-` into a numeric field puts that string into `formData`.

## Change

`asNumber()` keeps the raw string when `Number()` can't parse it, so a half-typed `1.2.3` or a lone `-` stays in the field's slot while it is edited. RJSF's validation reports it as a type error, and the `pattern` blocks submitting it. Expect a string there:

```diff
-const onChange = ({ formData }: IChangeEvent<MyData>) => setTotal(formData.price * 2);
+const onChange = ({ formData }: IChangeEvent<MyData>) => {
+  if (typeof formData?.price === 'number') setTotal(formData.price * 2);
+};
```

A native number input, through `ui:options.inputType: 'number'` or the `updown` widget, reports an unparseable value as empty.

## Verify

- Typing `-` into the field doesn't break your handler, and the field shows RJSF's type error until the value parses.
