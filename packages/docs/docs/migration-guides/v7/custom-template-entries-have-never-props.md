---
title: A custom template entry has never as its props type
description: A custom entry in `TemplatesType` used to be a `ComponentType<any>` and is now a `SlotComponent<never>`, alone or in a group. Narrow it with `isComponentType<P>()` before rendering it, and annotate the props of a template written inline.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [typescript, custom-templates]
schema: []
affects: [code]
related: [templates-prop-checks-template-props, templates-read-from-props-are-slot-components]
---

## Detect

- In your code: a custom template read from `registry.templates`, or from `getTemplates()` under a custom name, then rendered or passed on as a `ComponentType`.
- In your code: a custom template written inline, with no type on its `props`, in the `templates` prop of `Form` or another set of templates.
- The type checker reports `Property '…' does not exist on type 'never'.` (TS2339) inside an inline template, TS2345 where you pass a template read back on as a `ComponentType`, or `Type '…' is not assignable to type 'never'.` (TS2322) where you render it with props.

## Change

Any component still fits a custom entry, alone or in a group, except a class whose constructor requires a second argument, and naming it in the `uiSchema` works as before. Reading one back gives a component whose props type is `never`. Name the template's props in the lookup:

```diff
+import { isComponentType } from '@rjsf/utils';
+
 const { MyTemplate } = registry.templates;
-return typeof MyTemplate === 'function' ? <MyTemplate {...props} /> : null;
+if (!isComponentType<MyTemplateProps>(MyTemplate)) {
+  return null;
+}
+return <MyTemplate {...props} />;
```

For an entry in a group, narrow the group first, since `isComponentType()` is false for it, then name the props on the member. A `typeof` check alone isn't enough to find the group, because what `memo()`, `forwardRef()` and `lazy()` return is an object too:

```tsx
const { MyGroup } = registry.templates;
if (typeof MyGroup !== 'object' || isComponentType(MyGroup)) {
  return null;
}
const { MyTemplate } = MyGroup;
if (!isComponentType<MyTemplateProps>(MyTemplate)) {
  return null;
}
return <MyTemplate {...props} />;
```

Keep reading the template from the registry: importing the component directly ignores a theme or `templates` prop that registers another one under its name.

A template written inline takes `never` from the same entry, so annotate its `props` parameter:

```diff
-<Form schema={schema} validator={validator} templates={{ MyTemplate: (props) => <div>{props.children}</div> }} />
+<Form schema={schema} validator={validator} templates={{ MyTemplate: (props: MyTemplateProps) => <div>{props.children}</div> }} />
```

## Verify

- The type checker accepts your lookups and inline templates.
- Your custom templates still render where the `uiSchema` names them.
