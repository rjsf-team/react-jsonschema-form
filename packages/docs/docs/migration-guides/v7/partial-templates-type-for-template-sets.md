---
title: Type a set of templates as PartialTemplatesType instead of an Omit of TemplatesType
description: An `Omit` of `TemplatesType` with literal keys collapses to its index signature and checks none of the declared templates. Type the set as the new `PartialTemplatesType`, or build it from `DeclaredTemplatesType` and `CustomTemplateEntries`.
packages: ['@rjsf/utils']
uses: [typescript, custom-templates, custom-theme]
schema: []
affects: [code]
related: [templates-prop-checks-template-props]
---

## Detect

- In your code: a set of templates typed as `Omit<TemplatesType, …>` or `Partial<Omit<TemplatesType, …>>`.
- Nothing reports the `Omit` forms: they compile while checking none of the templates they hold.

## Change

`TemplatesType` has a string index signature for custom entries, so an `Omit` of it with literal keys, such as `Omit<TemplatesType, 'ButtonTemplates'>`, collapses to that signature and checks none of the declared templates. Type a set of templates as the new `PartialTemplatesType`, the type of the `templates` prop of `Form`. It checks each declared template, takes any of the `ButtonTemplates` on their own, and takes custom entries:

```diff
-import { TemplatesType } from '@rjsf/utils';
+import { PartialTemplatesType } from '@rjsf/utils';

-const templates: Partial<Omit<TemplatesType, 'ButtonTemplates'>> = {
+const templates: PartialTemplatesType = {
   FieldTemplate: MyFieldTemplate,
   MyTemplate,
 };
```

A `PartialTemplatesType` doesn't fit where a `Partial<TemplatesType>` is expected, such as the return type of a theme's `generateTemplates()`, because its `ButtonTemplates` may leave buttons out. Type a value that goes there as `Partial<TemplatesType>`, which checks the declared templates too but needs every button in a `ButtonTemplates` it holds.

To leave out other templates, omit them from the new `DeclaredTemplatesType`, the part of `TemplatesType` without that signature. Add the new `CustomTemplateEntries`, the part with it, if the type holds custom entries too. That signature takes a key you omitted unchecked, so declare it again with the type you want. See [Typing a set of templates](../../advanced-customization/custom-templates.md#typing-a-set-of-templates).

## Verify

- The type checker now reports a declared template in the set whose props don't match, and you fix it as in [The templates prop checks each declared template against its props](./templates-prop-checks-template-props.md).
- Nothing changes at runtime.
