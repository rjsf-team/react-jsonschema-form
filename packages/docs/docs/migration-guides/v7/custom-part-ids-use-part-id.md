---
title: A custom widget's own elements take their ids from partId()
description: Focus-on-error now falls back to the first input or button whose id is a part id of the field, so a control with an id such as `${id}-0` is no longer focused. Build such ids with `partId(id, name)`, which also keeps them from taking another field's id.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-widgets, custom-templates]
schema: []
affects: [code, experience]
related: [ids-cant-collide-or-split-an-id-list]
---

## Detect

- In your custom widgets or templates: an element beside the field's control, such as a popup or a second input, whose id appends a suffix of its own to the field's `id`, such as `${id}-0` or `${id}-picker`.
- On the rendered page: with focus-on-error on, submitting a form with an error in that field doesn't focus your widget when no element has the field's own id.

## Change

Take the id of such an element from `partId(id, '<name>')`, which joins the field's id and the part's name with `__`. RJSF never writes `__` into a field's own id, so the part can't take another field's id.

```diff
+import { partId } from '@rjsf/utils';
-<input id={`${id}-0`} />
+<input id={partId(id, '0')} />
```

Where no element has a field's id, focus-on-error focuses the first input or button whose id is a part of the field's. A widget whose controls use ids such as `${id}-0` is no longer focused for its field's error. See [Some rendered ids change so they cannot collide or split an id list](./ids-cant-collide-or-split-an-id-list.md) for how RJSF builds its own ids.

## Verify

- Submitting with an error in that field focuses your widget's first control.
- No element of your widget shares an id with another field.
