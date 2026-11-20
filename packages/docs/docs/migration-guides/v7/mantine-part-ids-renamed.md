---
title: Mantine's success message, label and description ids are renamed
description: '`@rjsf/mantine` used to give an input''s success message, label and description ids ending in `-success`, `-label` and `-description`. They are now `__success`, `__wrapperLabel` and `__wrapperDescription`, so update selectors, tests and snapshots.'
packages: ['@rjsf/mantine']
uses: [markup]
schema: []
affects: [appearance]
related: [ids-cant-collide-or-split-an-id-list, mantine-markup-uses-rjsf-ids]
---

## Detect

- In your CSS, tests or snapshots: an id such as `root_when-success`, `root_when-label`, `root_when-description` or `root_foo-key-label` rendered by `@rjsf/mantine`.

## Change

Aim at the v7 ids:

| Element                                                                        | v6                                                               | v7                                                                                        |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Success message                                                                | `root_when-success`                                              | `root_when__success`                                                                      |
| Label and description of an input, an additional property's key input included | `root_when-label`, `root_when-description`, `root_foo-key-label` | `root_when__wrapperLabel`, `root_when__wrapperDescription`, `root_foo__key__wrapperLabel` |

One id is still derived by Mantine rather than built by RJSF. `Select` and `MultiSelect` name their listbox by the `${id}-label` id Mantine gives their label, so that label keeps it, and a sibling property named such as `color-label` writes the same id. How Mantine widgets now reference RJSF's ids is covered in [Mantine inputs reference rjsf's error, description and help ids](./mantine-markup-uses-rjsf-ids.md). The core id changes are in [Some rendered ids change so they cannot collide or split an id list](./ids-cant-collide-or-split-an-id-list.md).

## Verify

- Your selectors and tests find the success message, labels and descriptions, and snapshots show the v7 ids.
