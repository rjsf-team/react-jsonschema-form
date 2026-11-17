---
title: Imports from a package's lib folder no longer resolve
description: Each package's `exports` now lists only its public entry points, so imports of `@rjsf/<package>/lib` or `lib/<file>.js` fail. Import the same names from the package root or a listed subpath.
packages: ['*']
uses: [tooling, utils-api]
schema: []
kind: removal
noticed: build
related: [label-is-exported-as-fieldlabel, compile-schema-validators-is-a-subpath, theme-components-have-no-import-path, utils-default-state-internals-not-exported, esm-only-packages]
---

## Detect

- `@rjsf/<package>/lib` or `@rjsf/<package>/lib/<file>.js` in your code.
- Node throws `ERR_PACKAGE_PATH_NOT_EXPORTED` for one of those imports, or your bundler fails to resolve it.
- Type checker under `node16`, `nodenext` or `bundler` resolution: `Cannot find module '@rjsf/<package>/lib/<file>.js' or its corresponding type declarations.`
- A tool that reads `@rjsf/snapshot-tests/package.json`.

## Change

An import of a path the package's `exports` doesn't list now fails in Node, in every bundler and in each TypeScript resolution that reads `exports`. A tool that ignores `exports`, such as webpack 4 or TypeScript's `node10` resolution, still finds the file, but nothing there is part of the public API.

These still resolve:

- each package's root, such as `@rjsf/core` or `@rjsf/utils`;
- `@rjsf/core/markdown`, `@rjsf/core/testing`, `@rjsf/core/rjsf.css` and `@rjsf/core/rjsf-theme.css`;
- `@rjsf/validator-ajv8/compileSchemaValidators` and `@rjsf/validator-ata/compileSchemaValidators`, see [compileSchemaValidators is imported from its own subpath](./compile-schema-validators-is-a-subpath.md).

Most deep imports name something the package root exports too, so import it from there:

```diff
-import SchemaField from '@rjsf/core/lib/components/fields/SchemaField.js';
-import { getUiOptions } from '@rjsf/utils/lib/getUiOptions.js';
+import { SchemaField } from '@rjsf/core';
+import { getUiOptions } from '@rjsf/utils';
```

`@rjsf/core` now exports `GridType`, `Operators`, `LAYOUT_GRID_OPTION`, `LAYOUT_GRID_UI_OPTION` and the `GridProps`, `GridSchemaType`, `LayoutGridSchemaType` and `LayoutGridFieldProps` types, which only `lib/components/fields/LayoutGridField.js` used to export. `@rjsf/utils` now exports `getMatchingPatternProperties()`, which only `lib/schema/retrieveSchema.js` used to export. `Label` from `lib/components/templates/FieldTemplate/Label.js` is exported as `FieldLabel`, see [core's Label is exported as FieldLabel](./label-is-exported-as-fieldlabel.md).

These have no import path any more:

- `@rjsf/core`'s `LayoutGridField` and `LayoutMultiSchemaField` helpers, such as `getSchemaDetailsForField()` and `computeEnumOptions()`.
- `@rjsf/core`'s `LOOKUP_REGEX`, which `LayoutGridField.js` exported beside `LAYOUT_GRID_OPTION`.
- `@rjsf/snapshot-tests/package.json`. A tool that needs it can read the file from `node_modules`.
- A theme's individual components, see [a theme's individual widgets and templates have no import path](./theme-components-have-no-import-path.md).
- `@rjsf/utils`' default-state internals and `calculateIndexScore()`, see [getDefaultFormState internals and calculateIndexScore have no import path](./utils-default-state-internals-not-exported.md).
- Every other module that a package's root doesn't export.

## Verify

- No code imports an `@rjsf/*` path outside the list above.
- Your build, tests and type checker resolve every `@rjsf/*` import.
