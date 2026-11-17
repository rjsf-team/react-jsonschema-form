---
title: An object's optional-data controls beside oneOf or anyOf render once
description: An object with its own properties beside a `oneOf`/`anyOf` used to draw its optional-data controls twice under one id. They now render once with the id of the component beside the options, so update selectors and snapshots that expected two sets.
packages: ['@rjsf/core']
uses: [form-props, markup]
schema: [any-of-one-of]
kind: markup
noticed: test
related: [ids-cant-collide-or-split-an-id-list]
---

## Detect

- In your `Form` props or `uiSchema`: `enableOptionalDataFieldForType` covering an object whose schema has `properties`, or room for more keys (`additionalProperties`, `patternProperties`), beside a `oneOf` or `anyOf`.
- In your tests or DOM snapshots: two sets of optional-data controls for that object sharing one DOM id.

## Change

The optional-data controls of such an object take the id of the component rendered beside the options, and the selected option draws none. v6 drew a second set for the option under the same DOM id. Update selectors and snapshots that expected the second set. The id of the component beside the options changed too, as [Some rendered ids change so they cannot collide or split an id list](./ids-cant-collide-or-split-an-id-list.md) lists.

## Verify

- The object renders one set of optional-data controls, and the DOM has no duplicate id for them.
- Snapshots of these forms change accordingly.
