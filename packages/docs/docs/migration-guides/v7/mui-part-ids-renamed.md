---
title: MUI's input label and helper text ids are renamed
description: '`@rjsf/mui` used to give an input''s label and helper text ids ending in `-label` and `-helper-text`. They are now `__inputLabel` and `__helperText`, so update selectors, tests and snapshots.'
packages: ['@rjsf/mui']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [ids-cant-collide-or-split-an-id-list]
---

## Detect

- In your CSS, tests or snapshots: an id such as `root_when-label`, `root_foo-key-label` or `root_when-helper-text` rendered by `@rjsf/mui`.

## Change

Aim at the v7 ids:

| Element                                                                      | v6                                      | v7                                                   |
| ---------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Label of a text input, a select or an additional property's key input        | `root_when-label`, `root_foo-key-label` | `root_when__inputLabel`, `root_foo__key__inputLabel` |
| Helper text of a text input or select, from `helperText` in `ui:options.mui` | `root_when-helper-text`                 | `root_when__helperText`                              |

The core id changes are in [Some rendered ids change so they cannot collide or split an id list](./ids-cant-collide-or-split-an-id-list.md).

## Verify

- Your selectors and tests find the labels and helper text, and snapshots show the v7 ids.
