---
title: Add buttons are titled Add Item, or after their object
description: "Add buttons were titled `Add` in core, bootstrap3 and daisyui; every theme now titles them `Add Item`, and an expandable object's after the object, such as `Add Address`. Update tests and translations that find or name the button by its title or text."
packages: ['*']
uses: [markup, form-props]
schema: [additional-properties, arrays]
kind: markup
noticed: test
related: [object-field-template-spreads-add-button-props]
---

## Detect

- In your tests, a query that finds an Add button by its title, its name or its text, such as `getByText('Add Item')` or `getByTitle('Add')`.
- In a custom `translateString`, a case for `TranslatableString.AddButton` or `TranslatableString.AddItemButton`.
- In `@rjsf/chakra-ui` and `@rjsf/shadcn`, an Add button that shows an icon where it showed `Add Item` as text.

## Change

The Add button of an expandable object, one with `additionalProperties` or `patternProperties`, is titled after the object's title, or its name where it has no title, through the new `TranslatableString.AddNamedButton`, `Add %1`, such as `Add Address` ([#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596)). An empty `ui:title` or `title` counts as none, so it falls through to the next one, as the object's heading does. It is titled so whether or not the object's heading is drawn, as under `ui:label: false`. An object with neither, such as an untitled root, keeps its theme's default title, as does every array's Add button.

Every theme's default title is now `Add Item`, through `TranslatableString.AddItemButton`. `@rjsf/core`, `@rjsf/bootstrap3` and `@rjsf/daisyui` titled the button `Add`, through `TranslatableString.AddButton`, which no template uses any more. `TranslatableString.AddButton` is deprecated and kept through v7. A custom template or `translateString` that reads it uses `AddItemButton` instead, or `AddNamedButton` for an object's button.

`@rjsf/chakra-ui` and `@rjsf/shadcn` render the Add button as an icon button, as their other buttons are, so it no longer shows `Add Item` as text. It is named by its title, which is also its `aria-label` in `@rjsf/chakra-ui`. A test that found it by its text finds it by its name instead:

```diff
-await user.click(screen.getByText('Add Item'));
+await user.click(screen.getByRole('button', { name: 'Add Item' }));
```

## Verify

- Each Add button's title reads `Add Item`, or `Add` followed by its object's title or name.
- Your tests find each Add button by its new name.
