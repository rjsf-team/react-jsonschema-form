---
title: AltDateWidget date parts are named by the field's label and the part
description: "Each `AltDateWidget` select was named by its part alone, such as `year`. It is now named by the field's label and the part, such as `When, year`, and carries the part's id as its `name`; update queries."
packages: ['@rjsf/core']
uses: [markup]
schema: [dates, enums]
kind: markup
noticed: test
related: [custom-select-widget-applies-aria-props, translate-string-table-needs-new-keys, mantine-markup-uses-rjsf-ids]
---

## Detect

- In your tests, a query for an `AltDateWidget` or `AltDateTimeWidget` part by its own name, such as `getByRole('combobox', { name: 'year' })`, or by the value it displays.
- A selector on a date part's `name` attribute, or code passing `name` to `DateElement`.
- A query by name for an untitled select, such as a root or array item select.
- Snapshot tests of forms with these widgets, in any theme.

## Change

Each select an `AltDateWidget` (and `AltDateTimeWidget`) renders is a control of its own. `DateElement` gives it the date part's id, such as `root__year`, as both its id and its `name`; the `name` prop it used to take is ignored and deprecated.

Each part is named by the field's label and the part, such as `When, year`, in every theme, `@rjsf/mantine` included, even when the field hides its label, so the parts of two date fields stay distinct. Only a field with no label at all leaves the part alone, such as `year` ([#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355)). Each part is also described by the field's description, help and errors, which no part was linked to before.

```diff
-screen.getByRole('combobox', { name: 'year' });
+screen.getByRole('combobox', { name: 'When, year' });
```

The parts' names and placeholders go through `translateString` as `TranslatableString.YearLabel`, `MonthLabel`, `DayLabel`, `HourLabel`, `MinuteLabel` and `SecondLabel`, and the way the label and the part are combined goes through `TranslatableString.DateElementAriaLabel` (`'%1, %2'`), so a locale can reorder them or change the separator ([#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357)). Their English defaults are the lowercase part names the widgets displayed before. A table that maps every key needs them; see [A translateString that maps every key needs the new TranslatableString keys](./translate-string-table-needs-new-keys.md).

Theme `SelectWidget`s changed to carry these names:

- `@rjsf/mui`'s `SelectWidget` describes its combobox instead of the field's root, and an `aria-label` or `aria-describedby` set in an `htmlInput` given through `rjsfSlotProps` still wins over both.
- `@rjsf/fluentui-rc`'s `SelectWidget` no longer renders an empty `<label>` for a field with no label, which named the dropdown by nothing.
- `@rjsf/shadcn`'s single `SelectWidget` trigger is a `combobox`, which holds the option it displays as its value, so a date part named by its `aria-label` still announces its selected option.

A select no label names, such as an untitled root or array item select, is named by its `ui:placeholder`, else `TranslatableString.SelectPlaceholder` ("Select ..."), since a select shows its value instead of a name ([#5711](https://github.com/rjsf-team/react-jsonschema-form/issues/5711)).

## Verify

- Each date part is found by `getByRole('combobox', { name: '<label>, <part>' })`.
- Snapshots gain the parts' `aria-label`, `aria-describedby`, ids and names; update them.
- If you replaced `SelectWidget`, check it applies these names; see [A SelectWidget or RadioWidget of your own applies the names rjsf hands it](./custom-select-widget-applies-aria-props.md).
