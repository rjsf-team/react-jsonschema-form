<!--

INSTRUCTIONS:

For each PR, add a changelog entry that describes what your PR does. Add it to the heading
for the appropriate package it modifies and include it in this format:
- [Description] ([Link to PR])

If your PR affects multiple packages, list it multiple times under headings for each package.
If it affects more general things such as dependency updates or non-package-specific changes,
add it under a "Dev / docs / playground" section.

You should also update the heading of the latest (upcoming) version if your PR change merits
it according to semantic versioning. For example, if your PR adds a breaking change, then you
should change the heading of the (upcoming) version to include a major version bump.

-->

# 7.0.0

## @rjsf/core

- **BREAKING CHANGE:** `GridType` and `Operators` are now `as const` objects with same-named union types instead of `enum`s, so the source is valid under Node's type stripping. Values and `GridType.ROW`-style member access are unchanged; code that used a member as a type must write `typeof GridType.ROW` instead of `GridType.ROW` ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))

## @rjsf/react-bootstrap

- Fixed `lib/index.js` being unloadable by Node: it imported `react-bootstrap/Col`-style directory subpaths and extensionless `@react-icons/all-files` paths, which only bundlers resolve. Components are now imported from `react-bootstrap` itself and icon files by their full `.js` name ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))

## @rjsf/utils

- **BREAKING CHANGE** Removed `defaultProps`-based options merging from `getWidget()`; a widget passed as a component is now returned as-is instead of being wrapped in a cached `MergedWidget`. Apply option defaults inside the widget itself instead (e.g. via destructuring). The now-unused `MergedWidget` property was also removed from the `Widget` type, and the `react-is` dependency was dropped
- **BREAKING CHANGE:** `TranslatableString` and `AdditionalItemsHandling` are now `as const` objects with same-named union types instead of `enum`s, so the source is valid under Node's type stripping. Values (`AdditionalItemsHandling` keeps `0`, `1`, `2`) and `TranslatableString.ArrayItemTitle`-style member access are unchanged; code that used a member as a type must write `typeof TranslatableString.ArrayItemTitle`, and the numeric enum's reverse mapping (`AdditionalItemsHandling[0]`) no longer exists ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))

## @rjsf/validator-ajv8

- Imports the `Ajv` class by name and reaches `ajv-formats` and `ajv/dist/standalone` through `.default`, which is where Node exposes those CommonJS modules' default export to ESM importers. No runtime change; the previous default-import spelling only typechecked under bundler resolution ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))

## Dev / docs / playground

- **BREAKING CHANGE** Dropped support for Node 20, 23, 25, and 24 releases before 24.11.0; `engines.node` is now `^22.18.0 || ^24.11.0 || >=26.0.0` across all packages, matching the active Node.js LTS lines, and CI now runs against Node 22, 24, and 26
- Upgraded pnpm from 10.17.1 to 12.3.4, which was previously pinned because pnpm 11+ requires Node >=22.13
- Dropped the `tsx` dev dependency; `@rjsf/shadcn`'s `build:css` script runs `build-css.ts` with `node` directly, which every Node release the `engines` field now allows strips types natively
- Upgraded TypeScript to 7.0.2. The root `typecheck` runs in 5 s instead of 22 s; `@rjsf/docs`'s editor-only tsconfig no longer extends `@tsconfig/docusaurus`, which sets `baseUrl`, an option TypeScript 7 removed (Docusaurus's own `@docusaurus/tsconfig` still sets it too) ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))
- `module` is now `nodenext` in `tsconfig.base.json` (was `esnext` with `moduleResolution: bundler`), so `tsc` checks the published `lib/` against Node's ESM rules. `@rjsf/chakra-ui` keeps bundler resolution with a comment saying why: `@chakra-ui/react` ships declarations Node's rules cannot resolve. Test files gained `with { type: 'json' }` on JSON imports and import `userEvent` by name, both of which the stricter rules require ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))
- Enabled `erasableSyntaxOnly`, which rejects `enum`, `namespace` and parameter properties; the four exported enums were the only violations ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))
- `packages/utils/test` no longer emits declarations for the validator packages' tests to consume. Each validator test project includes the shared schema test suite directly, so every test project is now `noEmit` ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))
- The root and playground `package.json` now say `"type": "module"`, so the playground typechecks under `nodenext` like every published package; `scripts/get-version-tag.js` is `.cjs` since it uses `require`. The playground's `ajv`, `ajv-i18n` and `@monaco-editor/react` imports use the same Node-correct spellings as the validator tests ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))
- **BREAKING CHANGE** Every package is now ESM-only: the CommonJS, bundled ESM and UMD builds in `dist/` and the `./dist` and `./dist/*.cjs` export paths are gone; `lib/` (per-file ESM plus declarations) is the only published output. `require()` of the packages keeps working on every supported Node version via native `require(esm)` ([#5255](https://github.com/rjsf-team/react-jsonschema-form/pull/5255), fixes [#3812](https://github.com/rjsf-team/react-jsonschema-form/issues/3812))
- Replaced the per-package `tsc -b` emit plus `esbuild` + `rollup` bundling with a single `tsdown` run driven by one shared `tsdown.base.mts`, which emits `lib/`. The build only transpiles; typechecking is the separate root `tsc --build`, and tsc no longer emits JavaScript (the package tsconfigs are `emitDeclarationOnly`) ([#5255](https://github.com/rjsf-team/react-jsonschema-form/pull/5255))
