---
title: Some rendered ids change so they cannot collide or split an id list
description: Ids are now escaped CSS identifiers and an element's part ids join with `__`, so property names with spaces or punctuation, date parts, options and key inputs get new ids. Aim your selectors, tests and snapshots at the v7 ids.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [ids-change-native-form-field-names, custom-part-ids-use-part-id, mantine-part-ids-renamed, mui-part-ids-renamed, daisyui-time-input-id-renamed, mantine-markup-uses-rjsf-ids]
---

## Detect

- In your CSS, tests or snapshots: a selector or expected id from the v6 column of the table below.
- In your schema: a property name that holds a space or an ASCII character other than a letter, digit, `-` or `_` (such as `.`, `:`, `/`, `#`, `[` or `%`), begins or ends with `_`, holds `__` or `-_`, ends with `-`, or is `''`.
- In your `Form` props: an `idPrefix` or `idSeparator` holding anything but letters, digits, `-` and `_`, or holding `__`.

## Change

Every id RJSF renders is built by `@rjsf/utils`. A field's own id comes from [`fieldPathToId()`](../../api-reference/utility-functions.md#fieldpathtoid). The id of an element that is part of a field, such as its description, a date part or the key input of an additional property, comes from [`partId()`](../../api-reference/utility-functions.md#partid), which joins the field's id and the part's name with `__`. `fieldPathToId()` never writes a `__` into a field's own id, so one field's part can't take another field's id. It writes no whitespace, so a field id stays one id in `aria-describedby`, `aria-labelledby` and `aria-controls` ([#5558](https://github.com/rjsf-team/react-jsonschema-form/issues/5558)). Every id is a CSS identifier as it stands, so `#${id}` selects the element in `querySelector()` and in a stylesheet with no escaping.

A property name is written into an id as it is, except for an escape: `-_` followed by the two uppercase hex digits of the character's code. A character is escaped when it is an ASCII character other than a letter, a digit, `-` or `_`; when it is an `_` that begins or ends the name, stands next to another `_` or follows a `-`; or when it is a `-` that ends the name. An empty name is written `-_FF`. Any other character, including an `_` or `-` inside a name and any non-ASCII letter, is written as it is. A name such as `firstName`, `first-name`, `snake_case_name` or `prénom` keeps its v6 id.

These ids change:

| Element                                                                                                                                                                                     | v6                                                                                                | v7                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field whose property name holds whitespace, such as `first name`                                                                                                                            | `root_first name`                                                                                 | `root_first-_20name`                                                                                                                                                 |
| Field whose property name holds another character a CSS identifier can't hold unescaped, such as `a.b`, `a:b` or `100%`                                                                     | `root_a.b`, `root_a:b`, `root_100%`                                                               | `root_a-_2Eb`, `root_a-_3Ab`, `root_100-_25`                                                                                                                         |
| Field whose property name begins or ends with `_`, holds `__` or `-_`, or ends with `-`, such as `_id`, `__typename` or `a-`                                                                | `root__id`, `root___typename`, `root_a-`                                                          | `root_-_5Fid`, `root_-_5F-_5Ftypename`, `root_a-_2D`                                                                                                                 |
| Field whose property name is `''`                                                                                                                                                           | `root_`                                                                                           | `root_-_FF`                                                                                                                                                          |
| Date part of an `AltDateWidget` ([#5504](https://github.com/rjsf-team/react-jsonschema-form/issues/5504))                                                                                   | `root_when_year`                                                                                  | `root_when__year`                                                                                                                                                    |
| Radio or checkboxes option, from `optionId()`                                                                                                                                               | `root_color-0`                                                                                    | `root_color__0`                                                                                                                                                      |
| Key input of an additional property, from the new `additionalKeyId()`                                                                                                                       | `root_foo-key`                                                                                    | `root_foo__key`                                                                                                                                                      |
| Expand button of a cyclic schema, from `expandButtonId()`                                                                                                                                   | `root_child-button`                                                                               | `root_child__expand`                                                                                                                                                 |
| Component rendered beside `anyOf`/`oneOf` options, from the new `besideOptionsId()`                                                                                                         | `root_pet_XxxOf`                                                                                  | `root_pet__XxxOf`, and `root_pet__XxxOf2` beside the options of an option that is itself an `anyOf`/`oneOf`                                                          |
| Option selector of an `anyOf`/`oneOf` option that is itself an `anyOf`/`oneOf`, from the new `optionSelectorId()` ([#5574](https://github.com/rjsf-team/react-jsonschema-form/issues/5574)) | `root_pet__anyof_select`, the same id as the selector above it                                    | `root_pet__anyof_select2`                                                                                                                                            |
| Type selector of the fallback UI for an unsupported type, from the new `fallbackTypeSelectorId()`                                                                                           | `root_x___internal_type_selector`, and `root.x.__internal_type_selector` under `idSeparator: '.'` | `root_x__internalTypeSelector`, `root_x__internalTypeSelector2` for an option offering types of its own, and `root.x__internalTypeSelector` under `idSeparator: '.'` |

Theme ids change too: see [Mantine's ids](./mantine-part-ids-renamed.md), [MUI's ids](./mui-part-ids-renamed.md) and [daisyUI's time input id](./daisyui-time-input-id-renamed.md).

Aim each selector or test at the v7 id, which `#${id}` selects as it is:

```diff
-container.querySelector('[id="root_first name"]');
+container.querySelector('#root_first-_20name');
```

The `idPrefix` and `idSeparator` are written into ids as given. To keep ids CSS identifiers holding no `__`, give each only letters, digits, `-` and `_`, with no `__` in either or where they meet.

A property name holding the `idSeparator` still writes the id a path of several names would, as in v6: the name `a_b` and the path `a.b` (a property `b` of a property `a`) both write `root_a_b`. Choose an `idSeparator` no property name holds to tell those apart.

These ids are also the `name` a native form submits; see [Changed ids change the names a native form submits](./ids-change-native-form-field-names.md). A custom widget's own elements should take their ids from `partId()`; see [A custom widget's own elements take their ids from partId()](./custom-part-ids-use-part-id.md).

## Verify

- Your selectors and tests find the elements, and snapshots show the v7 ids.
- No two elements on the page share an id, and `aria-describedby`, `aria-labelledby` and `aria-controls` name only ids that exist.
