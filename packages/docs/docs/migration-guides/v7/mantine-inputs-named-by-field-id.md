---
title: Mantine inputs are named by the field's id or the nameGenerator
description: Several `@rjsf/mantine` widgets named their input by the bare property name and ignored `nameGenerator`. They now use the `nameGenerator`, else the field id such as `root_address_city`, so update selectors and form-data parsing.
packages: ['@rjsf/mantine']
uses: [form-props, markup]
schema: []
kind: runtime
noticed: test
related: []
---

## Detect

- In your tests or CSS, a `[name="city"]` style selector, or `name=""` at the root, on a Mantine input.
- In your code, reading the browser's form data (`new FormData(form)`, a native submit) from a Mantine form.
- A `nameGenerator` prop on a `Form` from `@rjsf/mantine`.

## Change

`RangeWidget`, `PasswordWidget`, `TimeWidget`, `ColorWidget`, `FileWidget` and `DateTimeInput` name their input by the `nameGenerator`, which they ignored. Without one, they, `TextareaWidget` and `CheckboxWidget` name their input by the field's id (`root_address_city`), as the other widgets do. They used the bare property name (`city`, or `""` at the root).

Update any selector or form-data parsing that relied on the old `name`:

```diff
-container.querySelector('[name="city"]');
+container.querySelector('[name="root_address_city"]');
```

## Verify

Every Mantine input's `name` is its field id, or what your `nameGenerator` returns.
