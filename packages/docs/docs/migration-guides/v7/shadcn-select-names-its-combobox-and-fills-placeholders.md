---
title: shadcn's SelectWidget names its combobox and fills an empty placeholder
description: "`@rjsf/shadcn`'s selects had an unnamed combobox, a blank single trigger and a fixed \"Select ...\" placeholder. They are now named by the label, else `ui:placeholder`, else `SelectPlaceholder`, with a combobox trigger; update snapshots and queries."
packages: ['@rjsf/shadcn']
uses: [markup]
schema: [enums]
affects: [experience, appearance]
related: [shadcn-multi-select-takes-field-id-and-opens-on-action, select-open-list-named-by-field-label, translate-string-table-needs-new-keys]
---

## Detect

- Snapshot or visual tests of `@rjsf/shadcn` forms with a `SelectWidget`.
- In your tests, a query for the single select's trigger by the `button` role.
- A `ui:placeholder` on a multiple select, or a single select without one.

## Change

The multiple `SelectWidget` rendered its cmdk search combobox with no accessible name, and its search input always showed a hard-coded, untranslated "Select ..." that ignored `ui:placeholder`. The single `SelectWidget` rendered a blank trigger where no `ui:placeholder` was given ([#5458](https://github.com/rjsf-team/react-jsonschema-form/issues/5458)).

- The multiple select's combobox is named from the field's resolved label: the schema `title` or a `ui:title` override, falling back to `ui:placeholder` and then to the new `TranslatableString.SelectPlaceholder` ("Select ...") for an untitled field.
- The same fallback replaces the search input's hard-coded placeholder, and the field's description and `aria-required` reach the focusable combobox input.
- The single select fills its empty trigger from the same fallback, so without `ui:placeholder` it shows the translated placeholder.
- The single select's trigger has the `combobox` role, so it holds the option it displays as its value and is `aria-invalid` and `aria-required` as its field is. With no label drawn for it, it is named by the field's label or, for an untitled field, by its `ui:placeholder`, else `TranslatableString.SelectPlaceholder`.

Query the trigger by the `combobox` role:

```diff
-screen.getByRole('button', { name: 'Color' });
+screen.getByRole('combobox', { name: 'Color' });
```

A `translateString` table of your own gains the `SelectPlaceholder` key; see [A translateString that maps every key needs the new TranslatableString keys](./translate-string-table-needs-new-keys.md).

## Verify

- Visual snapshots change where a single select without `ui:placeholder` goes from blank to "Select ...", and where a multiple select with one shows it in place of "Select ...".
- Every select is found by `getByRole('combobox', { name })`.
