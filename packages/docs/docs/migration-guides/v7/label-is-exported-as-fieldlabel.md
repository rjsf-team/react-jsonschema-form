---
title: Core's Label is exported as FieldLabel and takes its class as className
description: '`@rjsf/core` exports its `Label` as `FieldLabel`, which takes a `className` and no longer renders `control-label`. Import `FieldLabel` from `@rjsf/core` and pass `joinClassNames(''rjsf-field-label'', registry.classMap.fieldLabel)`.'
packages: ['@rjsf/core']
uses: [custom-templates]
schema: []
affects: [code, appearance]
related: [deep-imports-removed, field-template-keeps-core-layout-classes]
---

## Detect

- `@rjsf/core/lib/components/templates/FieldTemplate/Label` in an import in your code.
- Your bundler or type checker reports that path as unresolved or not exported from `@rjsf/core`.
- On the rendered page, a label your template draws with it has no `control-label` class.

## Change

`@rjsf/core`'s `Label`, which only `lib/components/templates/FieldTemplate/Label.js` exported, is exported from `@rjsf/core` as `FieldLabel`, with its props type as `FieldLabelProps`. Deep imports into `lib/` no longer resolve, see [imports from a package's lib folder no longer resolve](./deep-imports-removed.md).

`FieldLabel` takes a `className` and no longer renders `control-label` itself. Pass `joinClassNames('rjsf-field-label', registry.classMap.fieldLabel)`, as core's templates do, to give it the label marker and the theme's label class:

```diff
-import Label from '@rjsf/core/lib/components/templates/FieldTemplate/Label.js';
+import { FieldLabel } from '@rjsf/core';
+import { joinClassNames } from '@rjsf/utils';

-<Label label={label} required={required} id={id} />
+<FieldLabel
+  label={label}
+  required={required}
+  id={id}
+  className={joinClassNames('rjsf-field-label', registry.classMap.fieldLabel)}
+/>
```

A custom `FieldTemplate` that should line up with core's layout keeps the `rjsf-field-label` marker, see [a custom FieldTemplate keeps core's label and description markers to line up](./field-template-keeps-core-layout-classes.md).

## Verify

The import resolves from `@rjsf/core`, and the rendered `<label>` carries `rjsf-field-label` plus your theme's label class. A test or stylesheet that selected `.control-label` on it now matches only if your theme's `fieldLabel` class includes it.
