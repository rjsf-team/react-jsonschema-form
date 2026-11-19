---
title: A custom ObjectFieldTemplate spreads addButtonProps onto its AddButton
description: "An object's Add button is now titled after the object through the new `addButtonProps` prop of `ObjectFieldTemplateProps`, which a custom template doesn't pass on. Spread `addButtonProps` onto the template's `AddButton`."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-templates]
schema: [additional-properties]
affects: [code, experience]
related: [add-buttons-titled-add-item-or-after-their-object, object-field-template-calls-schema-utils-can-expand]
---

## Detect

- In your code, a custom `ObjectFieldTemplate` that renders an `AddButton` without `addButtonProps`.
- On the page, its Add button keeps the theme's default title where the default template's reads `Add` and the object's title, such as `Add Address`.
- In your code, a custom `AddButton` that ignores its `title` prop or has no title of its own.

## Change

`ObjectFieldTemplateProps` has an `addButtonProps` prop, `{ title }`. It is undefined for an object with no title or name, or when `translateString` gives an empty `TranslatableString.AddNamedButton`. A custom `ObjectFieldTemplate` spreads it onto its `AddButton` to title it after the object:

```tsx
<AddButton id={buttonId(id, 'add')} onClick={onAddProperty} {...addButtonProps} registry={registry} />
```

A custom `AddButton` receives that title as its `title` prop, and should keep a default for when there is none, as the themes' do.

## Verify

- The template's Add button is titled after its object, and an untitled object's keeps the default title.
