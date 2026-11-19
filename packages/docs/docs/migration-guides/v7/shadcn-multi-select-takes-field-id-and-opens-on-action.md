---
title: shadcn's multiple SelectWidget input takes the field's id and opens on user action
description: "`@rjsf/shadcn`'s multiple select input had a cmdk-generated id and opened its list on focus. It now has the field's id and opens on a click, typing, arrows or Enter, so query it by role and click it before choosing an option."
packages: ['@rjsf/shadcn']
uses: [markup]
schema: [arrays]
affects: [experience, appearance]
related: [shadcn-select-names-its-combobox-and-fills-placeholders, select-open-list-named-by-field-label]
---

## Detect

- In your tests or CSS, a `[cmdk-input]` selector, or an id such as `radix-_r_3h_`, on a `@rjsf/shadcn` multiple `SelectWidget`.
- A test that focuses the input and expects its list of options to open.
- Snapshot tests of forms with a multiple select.

## Change

The input was cmdk's, with an id cmdk generated and a `cmdk-input` attribute, and its list opened as soon as it took focus. The input now has the field's id, such as `root_color`, and no `cmdk-input` attribute, so the field's label and `focusOnFirstError` focus it. Its list opens on a click, typing, Down Arrow, Up Arrow or Enter, not on focus, so `ui:autofocus` and `focusOnFirstError` leave it closed.

Find the input by the field's id or its role, and open the list before choosing an option:

```diff
-const input = container.querySelector('[cmdk-input]');
-input.focus();
+const input = screen.getByRole('combobox', { name: 'Color' });
+await user.click(input);
 await user.click(screen.getByRole('option', { name: 'red' }));
```

## Verify

- Snapshots show the field's id on the input; update them.
- Clicking the input opens the list, and focusing it alone does not.
