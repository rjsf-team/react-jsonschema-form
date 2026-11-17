---
title: A template read from the templates prop is a SlotComponent
description: A declared template read from `props.templates` used to be a `ComponentType<any>` and is now that template's `SlotComponent`, such as `SlotComponent<FieldTemplateProps>`. Pass it only its own props, and narrow it with `isComponentType()` before passing it on.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [typescript, custom-templates]
schema: []
kind: type
noticed: type-error
related: [templates-prop-checks-template-props, custom-template-entries-have-never-props]
---

## Detect

- In your code: a component that wraps `Form` and reads a declared template such as `props.templates?.FieldTemplate`.
- The type checker reports `Type '…' is not assignable to type '…'.` (TS2322) where you render it with props the template doesn't take, such as `<FieldTemplate {...fieldProps} extra='x' />`.
- The type checker reports TS2345 where a `typeof` check narrows it and you pass it on as a React `ComponentType`.

## Change

Render the template with only its own props. A React `ComponentType` annotation doesn't take a `SlotComponent`, so name its props with `isComponentType()` instead of a `typeof` check:

```diff
+import { isComponentType } from '@rjsf/utils';
+
 const { FieldTemplate } = props.templates ?? {};
-if (typeof FieldTemplate === 'function') {
+if (isComponentType<FieldTemplateProps>(FieldTemplate)) {
   wrap(FieldTemplate); // wrap(component: ComponentType<FieldTemplateProps>)
 }
```

## Verify

- The type checker accepts the wrapper.
- The wrapped template still renders as before, since nothing changes at runtime.
