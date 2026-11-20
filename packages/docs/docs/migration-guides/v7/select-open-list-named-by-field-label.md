---
title: An open daisyUI or shadcn select list is named by the field's label
description: "An open `SelectWidget` list was unnamed in daisyUI and named \"Suggestions\" in shadcn. It now takes the field's label, so `getByLabelText` matches the list too; find the combobox by role and full name, and the list by the label."
packages: ['@rjsf/daisyui', '@rjsf/shadcn']
uses: [markup]
schema: [enums]
affects: [experience]
related: [shadcn-select-names-its-combobox-and-fills-placeholders, shadcn-multi-select-takes-field-id-and-opens-on-action]
---

## Detect

- In your tests, `getByLabelText` with a field's label to find a `@rjsf/daisyui` or `@rjsf/shadcn` `SelectWidget` while its list is open. daisyUI's list is open whenever the select has focus, as after a click, `ui:autofocus` or `focusOnFirstError`.
- A query for shadcn's list by the name `Suggestions`.
- On a required field, a test that clicks or types into what `getByLabelText` returns and finds the list instead of the combobox.

## Change

daisyUI's list had no name, and shadcn's was always named "Suggestions", cmdk's default. While it is open, the list is now named by the field's label, else its `ui:placeholder`, else `TranslatableString.SelectPlaceholder` ("Select ..."), in shadcn's single and multiple select alike.

While the list is open, `getByLabelText` with the field's label finds both the combobox and the list, so it throws. On a required field, whose label reads "Color*", it doesn't throw: the combobox is named "Color*", so `getByLabelText('Color')` matches only the open list, through the label's text, and returns it.

Find the list by the field's label, or by its role alone, and the combobox by its role and its whole name, "Color*" on a required field, which matches it alone, open or closed:

```diff
-screen.getByRole('listbox', { name: 'Suggestions' });
+screen.getByRole('listbox', { name: 'Color' });
-screen.getByLabelText('Color');
+screen.getByRole('combobox', { name: 'Color' });
```

## Verify

Your tests find the combobox and the list each by one query, with the list open and closed, on required and optional fields.
