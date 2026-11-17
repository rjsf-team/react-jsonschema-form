---
title: Custom daisyUI buttons that render their own button add the btn class
description: "@rjsf/daisyui's `btn btn-sm` now comes from the class map's `iconButton`, not the `className` button templates get. A custom button rendering its own `<button>` adds `btn` itself or reads `registry.classMap.iconButton`."
packages: ['@rjsf/daisyui']
uses: [custom-templates]
schema: []
kind: markup
noticed: review
related: [daisyui-renders-core-components]
---

## Detect

- A custom `AddButton`, `RemoveButton`, `CopyButton`, `MoveUpButton` or `MoveDownButton` in your `templates` for `@rjsf/daisyui` that renders its own `<button>` with the `className` it receives.
- On the rendered page, that button has lost its daisyUI button styling.

## Change

The theme's add, remove, copy and move buttons are now core's `IconButton` (see [The daisyUI theme renders core's templates and widgets with its classes](./daisyui-renders-core-components.md)). Their `btn btn-sm` classes come from the class map's `iconButton`, which core's `IconButton` reads, rather than from the `className` the theme hands the button templates. Add `btn` yourself, or read the class from `registry.classMap.iconButton`:

```diff
+import { joinClassNames } from '@rjsf/utils';
+
 function MyRemoveButton({ className, registry, ...props }) {
-  return <button type='button' className={className} {...props} />;
+  return <button type='button' className={joinClassNames(registry.classMap.iconButton, className)} {...props} />;
 }
```

## Verify

- Your custom button renders with the `btn` class and looks like the theme's own buttons.
