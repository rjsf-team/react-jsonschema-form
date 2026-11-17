---
title: The templates prop checks each declared template against its props
description: The `templates` prop of `Form`, and a theme's `templates` passed to `withTheme()`, now check a declared template such as `FieldTemplate` against its own props. Type the template's `props` as that template's, such as `FieldTemplateProps`.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [typescript, custom-templates, custom-theme]
schema: []
kind: type
noticed: type-error
related:
  [
    custom-template-entries-have-never-props,
    partial-templates-type-for-template-sets,
    templates-read-from-props-are-slot-components,
  ]
---

## Detect

- In your code: `templates={…}` on `Form`, or a theme passed to `withTheme()` whose `templates` hold a declared template such as `FieldTemplate` or `ArrayFieldTemplate` written for other props.
- The type checker reports `Type '…' is not assignable to type '…'.` (TS2322) on that template's key.

## Change

These used to accept any component for a declared template. Each one is now checked against its own props, so a template written for other props no longer compiles. Type its `props` as the template's:

```diff
-function MyFieldTemplate(props: MyProps) {
+function MyFieldTemplate(props: FieldTemplateProps) {
```

A custom template written inline in the prop needs a type on its `props` too; see [A custom template entry has never as its props type](./custom-template-entries-have-never-props.md).

## Verify

- The type checker accepts the `templates` you pass.
- Nothing changes at runtime.
- To type a set of templates held in a variable, see [Type a set of templates as PartialTemplatesType](./partial-templates-type-for-template-sets.md).
