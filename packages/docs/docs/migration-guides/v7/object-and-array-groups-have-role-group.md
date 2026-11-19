---
title: Object and array containers are named groups carrying the field's id
description: Object and array containers in six themes rendered no element or one with no role. They are now `role="group"` elements carrying the field's `id`, named by the title, so update child selectors and give `getByRole('group')` a name.
packages: ['@rjsf/chakra-ui', '@rjsf/daisyui', '@rjsf/fluentui-rc', '@rjsf/mantine', '@rjsf/mui', '@rjsf/react-bootstrap']
uses: [markup]
schema: []
affects: [experience, appearance]
related: [daisyui-field-label-and-widget-markup-changed]
---

## Detect

- In your CSS or tests, a selector that finds an object's or array's title, description or contents by where they sit in the DOM, such as a direct-child selector.
- A test that calls `getByRole('group')` without a name, or finds a container by the field's `id`.
- Snapshot tests of forms with objects or arrays in these themes.

## Change

An object's or an array's title, description and contents are now a group, named by the title and described by the field's errors, description and help, so a screen reader reads them together ([#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723)):

- In `@rjsf/chakra-ui`, `@rjsf/fluentui-rc`, `@rjsf/mui` and `@rjsf/react-bootstrap`, `ObjectFieldTemplate` rendered them with no element around them, and in `@rjsf/fluentui-rc` so did `ArrayFieldTemplate`. They now render inside a `div` with `role="group"` carrying the field's `id`.
- `@rjsf/daisyui`'s `ArrayFieldTemplate` and `ObjectFieldTemplate`, `@rjsf/mantine`'s `ObjectFieldTemplate`, and the `ArrayFieldTemplate` of `@rjsf/chakra-ui`, `@rjsf/mui` and `@rjsf/react-bootstrap` give the element they already rendered `role="group"`, and the field's `id` where it didn't carry it.
- A `<fieldset>`, which every other container renders, is a group already, and only gains the name and description.

Point a child selector at the new `div`, as in `[role="group"] > ...`. A test calling `getByRole('group')` can now find the root object's group as well, so give it the group's name or search within the field:

```diff
-screen.getByRole('group');
+screen.getByRole('group', { name: 'Pets' });
```

## Verify

- Each object and array container is found by `getByRole('group', { name })` with its title.
- Snapshots gain the group element or its `role` and `id`; update them.
