---
title: daisyUI's date-time picker time input id is renamed
description: '`@rjsf/daisyui` used to give the time input in the date-time picker popup the id `root_when-picker`. It is now `root_when__time`, so update selectors, tests and snapshots.'
packages: ['@rjsf/daisyui']
uses: [markup]
schema: [dates]
affects: [appearance]
related: [ids-cant-collide-or-split-an-id-list]
---

## Detect

- In your CSS, tests or snapshots: an id ending in `-picker`, such as `root_when-picker`, for the time input of a `@rjsf/daisyui` date-time picker.

## Change

```diff
-container.querySelector('#root_when-picker');
+container.querySelector('#root_when__time');
```

The core id changes are in [Some rendered ids change so they cannot collide or split an id list](./ids-cant-collide-or-split-an-id-list.md).

## Verify

- Your selectors and tests find the time input, and snapshots show `root_when__time`.
