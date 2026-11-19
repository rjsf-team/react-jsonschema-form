---
title: A translateString that maps every key needs the new TranslatableString keys
description: v7 adds 20 `TranslatableString` keys for date parts, pickers, selects, groups, array items, numeric inputs and forbidden keys. A custom `translateString` that maps every key must add them, or fall back to `englishStringTranslator()`.
packages: ['@rjsf/core', '@rjsf/utils', '@rjsf/daisyui', '@rjsf/mui', '@rjsf/shadcn']
uses: [form-props]
schema: []
kind: runtime
noticed: review
related: [alt-date-parts-named-by-field-label, daisyui-date-picker-trigger-and-popup-markup-changed, shadcn-select-names-its-combobox-and-fills-placeholders, translatable-string-is-a-const-object, number-input-title-tooltip-and-name, forbidden-extra-key-row-shows-error, custom-select-widget-applies-aria-props, required-array-widget-needs-min-items, markdown-needs-markdown-template]
---

## Detect

- In your code, a `translateString` passed to `Form` that looks each key up in a table or `switch` of your own, with no fallback to `englishStringTranslator()` for keys it doesn't know.
- On the rendered page, an empty or `undefined` date part name, picker button, placeholder, group name or tooltip in a translated form.
- If your table is typed `Record<TranslatableString, string>`, the type checker reports the keys it is missing.

## Change

These keys are new in v7. Each English default is what `englishStringTranslator()` returns, with `%1` and `%2` replaced by the parameters.

| Key                                                                            | English default                                      | Used for                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `YearLabel`, `MonthLabel`, `DayLabel`                                          | `year`, `month`, `day`                               | `AltDateWidget` part names and placeholders; see [AltDateWidget date parts are named by the field's label and the part](./alt-date-parts-named-by-field-label.md)                                          |
| `HourLabel`, `MinuteLabel`, `SecondLabel`                                      | `hour`, `minute`, `second`                           | `AltDateTimeWidget` part names and placeholders                                                                                                                                                            |
| `DateElementAriaLabel`                                                         | `%1, %2`                                             | how a date part's name combines the field's label and the part                                                                                                                                             |
| `SelectPlaceholder`                                                            | `Select ...`                                         | the name and placeholder of a select no label names; see [shadcn's SelectWidget names its combobox and fills an empty placeholder](./shadcn-select-names-its-combobox-and-fills-placeholders.md)           |
| `RadioGroupName`                                                               | `Choose an option`                                   | the name of a radio group no label names; see [A SelectWidget or RadioWidget of your own applies the names rjsf hands it](./custom-select-widget-applies-aria-props.md)                                    |
| `RequiredGroupCue`                                                             | `required`                                           | the end of a required checkbox group's accessible name; see [A required checkbox group, multiple select, file input or array widget needs minItems](./required-array-widget-needs-min-items.md)            |
| `DoneLabel`, `TimeLabel`                                                       | `Done`, `Time`                                       | `@rjsf/daisyui`'s date picker Done button and time input label; see [daisyUI's date pickers open from a combobox button into one popup element](./daisyui-date-picker-trigger-and-popup-markup-changed.md) |
| `NumberInputTitle`, `IntegerInputTitle`                                        | `Enter a number`, `Enter a whole number`             | the title of a numeric input; see [Numeric inputs carry a title shown as a tooltip and used as a fallback name](./number-input-title-tooltip-and-name.md)                                                  |
| `AdditionalPropertyKeyNotAllowed`                                              | `The key "%1" is not allowed here`                   | the error on a row for a forbidden extra key; see [A row for a forbidden extra key shows an error from the first render](./forbidden-extra-key-row-shows-error.md)                                         |
| `CopyItemButton`, `MoveUpItemButton`, `MoveDownItemButton`, `RemoveItemButton` | `Copy %1`, `Move %1 up`, `Move %1 down`, `Remove %1` | the buttons of an array item named through `ui:options.itemLabel`; `RemoveItemButton` also names the remove button of a selected item in `@rjsf/shadcn`'s multiple select                                  |
| `ItemNameWithNumber`                                                           | `%1 (%2)`                                            | an array item named through `ui:options.itemLabel` that shares its name with another, and each thumb of a `@rjsf/mui` range of several values                                                              |

Add each to your table, or fall back to the English translator for keys you don't translate:

```diff
+import { englishStringTranslator } from '@rjsf/utils';
+
 function translateString(key: TranslatableString, params?: string[]) {
-  return myTranslator(key, params);
+  return key in myTable ? myTranslator(key, params) : englishStringTranslator(key, params);
 }
```

A `TranslatableString` key is its English text, so a table keyed by `TranslatableString.X` follows a changed default on its own, and one keyed by literal strings does not. The English `UnsupportedField*` and `FilesInfo` strings no longer use markdown syntax; see [Markdown is an opt-in template](./markdown-needs-markdown-template.md). `InvalidObjectField` is removed, since [an incomplete ui:order renders the object instead of an error](./incomplete-ui-order-renders-the-object.md); see [TranslatableString.InvalidObjectField is removed](./translatable-string-invalid-object-field-removed.md). `TranslatableString` is also an `as const` object now; see [TranslatableString is an as const object instead of an enum](./translatable-string-is-a-const-object.md).

## Verify

In a form rendered with your `translateString`, date parts, daisyUI's pickers, untitled selects and radio groups, required checkbox groups, numeric input tooltips, forbidden extra keys and array item buttons all show translated text.
