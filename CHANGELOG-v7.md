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

## @rjsf/antd

- **BREAKING CHANGE** Dropped support for `antd` version 5; the peer dependency range is now `^6.3.6`. `ErrorList` and `CyclicSchemaExpandTemplate` use of `Alert` always passing `title` prop now. The `6.3.6` floor isn't arbitrary: antd 6.0.0-6.3.5 crash `@rjsf/antd` forms on first render (`getRealHeight` destructuring a `null` node), fixed upstream in [ant-design/ant-design#57636](https://github.com/ant-design/ant-design/pull/57636)

## @rjsf/chakra-ui

- Converted the internal `forwardRef`-wrapped UI primitives (`Field`, `Slider`, `Alert`, `NumberInputRoot`, `Checkbox`, `Radio`, `CloseButton`, and the `Select` family) to plain function components that accept `ref` as a regular prop, now that React 19 supports this natively
- `SelectRoot` is now a plain generic function (`function SelectRoot<T extends CollectionItem>(...)`) instead of a non-generic arrow function cast to `ChakraSelect.RootComponent`, removing the cast and the wrapping parens it required

## @rjsf/core

- **BREAKING CHANGE:** `GridType` and `Operators` are now `as const` objects with same-named union types instead of `enum`s, so the source is valid under Node's type stripping. Values and `GridType.ROW`-style member access are unchanged; code that used a member as a type must write `typeof GridType.ROW` instead of `GridType.ROW` ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))
- **BREAKING CHANGE** `withTheme()` now returns a plain function component instead of a `forwardRef`-wrapped one, and `FormProps['onSubmit']`'s event parameter is now typed as `SubmitEvent<any>` instead of the deprecated `FormEvent<any>`
- **BREAKING CHANGE:** Removed deprecated `Form` APIs: the `getUsedFormData()` and `getFieldNames()` instance methods (no direct replacement), the `omitExtraData()` instance method (use `SchemaUtils.omitExtraData(schema, formData)` instead), the `removeEmptyOptionalObjects` prop (already a no-op; use `omitExtraData`, which now prunes empty optional objects itself), and `boolean` values for the `liveValidate`/`liveOmit` props (use `'onChange'` in place of `true`, or omit the prop in place of `false`). Also removed the `ui:rootFieldId` uiSchema directive; use the `Form.idPrefix` prop instead
- **BREAKING CHANGE** Replaced the `extraErrorsBlockSubmit` prop with `extraErrorsAreWarnings`, inverting the default: `extraErrors` now block form submission unless `extraErrorsAreWarnings` is set to `true`, fixing [#4964](https://github.com/rjsf-team/react-jsonschema-form/issues/4964)
- Fixed `validateFormWithFormData()` (used by form submission and the `validateForm()` instance method) silently dropping a `customError` raised by a field/widget's `onChange` on submit; it's now merged in and blocks submission the same way schema and (non-warning) `extraErrors` do
- **BREAKING CHANGE:** Removed the private `_internalFormWrapper` prop from `FormProps` and `ThemeProps`; its only consumer was the removed `@rjsf/semantic-ui` theme. Use `tagName` to render a different element in place of `<form>`
- **BREAKING CHANGE** Dropped the `experimental_` prefix from `FormProps`, now that these features are no longer experimental: `experimental_defaultFormStateBehavior` → `defaultFormStateBehavior`, `experimental_customMergeAllOf` → `customMergeAllOf`
- Added `withStrictUiSchema`, a Higher-Order Component that wraps `Form` (or a themed `Form` returned by `withTheme()`) and returns a version of it whose `uiSchema` prop is typed as `@rjsf/utils`'s new `UiOptions` instead of the permissive `UiSchema`, so an inline `uiSchema` object literal is checked against it directly with no fallback for a mistake to slip through ([#4916](https://github.com/rjsf-team/react-jsonschema-form/issues/4916))

## @rjsf/mantine

- **BREAKING CHANGE** Dropped support for `mantine` version 8; upgraded to `mantine` version 9, which requires React 19.2+. The `react` peer dependency floor is `>=19.2`, matching what `@mantine/core`/`@mantine/hooks` 9.6.1 themselves require (their `useEffectEvent` usage needs it)
- Fixed `ObjectFieldTemplate` and the fluid variant of `GridTemplate` rendering their root `Container` at Mantine's default constrained width (960px, centered), instead of filling the space the form was given. Both now pass Mantine's `fluid` prop
- **BREAKING CHANGE** Fixed `GridTemplate` silently dropping `gutter` from `ui:row`/`ui:col` options: Mantine 9 renamed `Grid`'s `gutter` prop to `gap`, so a `gutter` value spread onto `<Grid>` was leaking through as an unrecognized DOM attribute instead of controlling spacing. `GridTemplate` now maps `gutter` to `gap` (an explicit `gap` still wins if both are provided); existing `ui:row`/`ui:col` options that use `gutter` keep working, but should be renamed to `gap` going forward
- Updated the README's prerequisites, which still listed `@mantine/core|hooks|dates >= 8` and didn't mention the React 19.2+ requirement

## @rjsf/mui

- Updated the README, which said "Material UI 7 requires React 18, so you will need to upgrade" — the peer requirement is now React 19
- **BREAKING CHANGE** Dropped support for `@mui/material`/`@mui/icons-material` version 7; the peer dependency range is now `^9.0.0`

## @rjsf/react-bootstrap

- Fixed `lib/index.js` being unloadable by Node: it imported `react-bootstrap/Col`-style directory subpaths and extensionless `@react-icons/all-files` paths, which only bundlers resolve. Components are now imported from `react-bootstrap` itself and icon files by their full `.js` name ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))

## @rjsf/shadcn

- Converted the internal `forwardRef`-wrapped `Command` and `CommandInput` components to plain function components that accept `ref` as a regular prop, now that React 19 supports this natively

## @rjsf/utils

- **BREAKING CHANGE** Removed `defaultProps`-based options merging from `getWidget()`; a widget passed as a component is now returned as-is instead of being wrapped in a cached `MergedWidget`. Apply option defaults inside the widget itself instead (e.g. via destructuring). The now-unused `MergedWidget` property was also removed from the `Widget` type, and the `react-is` dependency was dropped
- **BREAKING CHANGE:** `TranslatableString` and `AdditionalItemsHandling` are now `as const` objects with same-named union types instead of `enum`s, so the source is valid under Node's type stripping. Values (`AdditionalItemsHandling` keeps `0`, `1`, `2`) and `TranslatableString.ArrayItemTitle`-style member access are unchanged; code that used a member as a type must write `typeof TranslatableString.ArrayItemTitle`, and the numeric enum's reverse mapping (`AdditionalItemsHandling[0]`) no longer exists ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))
- **BREAKING CHANGE** `ObjectFieldTemplatePropertyType` is now generic (`<T, S, F>`, all defaulted like every other RJSF generic type) and its `content` field is typed as `ReactElement<Pick<FieldProps<T, S, F>, 'schema' | 'uiSchema'>>` instead of a bare `ReactElement`. React 19's types default a bare `ReactElement`'s props to `unknown` instead of `any`, which broke themes (e.g. `@rjsf/antd`) that read `.content.props.schema`/`.content.props.uiSchema` directly; the typed version fixes that without widening to `any`. `ObjectFieldTemplateProps['properties']` now threads its own `<T, S, F>` through to `ObjectFieldTemplatePropertyType`. This is only a breaking change if you referenced `ObjectFieldTemplatePropertyType` with explicit (non-default) generics, or relied on `content.props` being typed as `any`
- **BREAKING CHANGE:** Removed deprecated exports: the `getUsedFormData()` and `getFieldNames()` functions (no direct replacement), `removeOptionalEmptyObjects()` (use `omitExtraData`, which has the equivalent pruning built in), `toPathSchema()` and the `PathSchema` type (no direct replacement), and the `toPathSchema()` method on `SchemaUtilsType`/`SchemaUtils`. Also removed the `'ui:rootFieldId'` property from the `UiSchema` type; use the `Form.idPrefix` prop instead
- **BREAKING CHANGE** Dropped the `Experimental_`/`experimental_` prefix, now that these features are no longer experimental: the `Experimental_DefaultFormStateBehavior`, `Experimental_ArrayMinItems`, and `Experimental_CustomMergeAllOf` types are now `DefaultFormStateBehavior`, `ArrayMinItems`, and `CustomMergeAllOf`; the `experimental_defaultFormStateBehavior`/`experimental_customMergeAllOf` parameters on `createSchemaUtils()` and the schema utility functions (`getDefaultFormState`, `retrieveSchema`, `isSelect`, `isMultiSelect`, `isFilesArray`, `omitExtraData`, `sanitizeDataForNewSchema`, `getClosestMatchingOption`, `getDisplayLabel`, `getFromSchema`, `findFieldInSchema`, `findSelectedOptionInXxxOf`, and the `SchemaUtilsType`/`SchemaUtils` methods that thread them through) are now `defaultFormStateBehavior`/`customMergeAllOf`
- Added `UiOptions`, an opt-in, type-safe alternative to `UiSchema` that narrows `ui:widget`/`ui:field`/`ui:options` to only the values valid for each field's form-data type (instead of falling back to `Record<string, any>`), recursing into nested objects/arrays. The built-in widget/field/option vocabulary lives in the new `CoreUiOptionsChecks`; themes and consumers extend it with their own `UiOptionsCheck` entries via `UiOptions`'s `Checks` type parameter. This is purely additive - `UiSchema` is unchanged ([#4916](https://github.com/rjsf-team/react-jsonschema-form/issues/4916))

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
- **BREAKING CHANGE** Upgraded `react` and `react-dom` to 19.2+ across the repo (required by the `@rjsf/mantine` upgrade to Mantine 9) and raised every theme package's `react` peer dependency floor from `>=18` to `>=19`, matching the "React 19 is officially supported on all the themes" policy already declared in the v7 upgrade guide. Fixed the handful of type errors this surfaced from React 19's stricter types (`useRef` without a non-null initial value now returns `RefObject<T | null>`, and a bare `ReactElement`'s props default to `unknown`)
- Bumped `react`/`react-dom`/`@types/react`/`@types/react-dom` further, to 19.3.0. Doing so and running `pnpm install` initially forked the graph into two react copies (19.2.8 and 19.3.0) with `react-dom@19.3.0` paired against `react@19.2.8` in part of the tree, breaking hooks across that boundary. That turned out to be lockfile inertia rather than a real conflict: only the root and playground `package.json` declare `react` directly, every other package has it as a loose peer range (`>=18`), and `pnpm install` only re-resolves entries whose specifier changed — the ~578 peer-resolved `react@19.2.8` entries were left as-is since 19.2.8 still satisfied `>=18`, and `react-dom` (bumped directly) got paired against those stale entries. `pnpm dedupe` re-resolves the whole graph and fixes it without needing a version-pinning override (which would've also silently overridden any third-party package with a legitimately narrower react peer range)
- Fixed the playground crashing with "Cannot destructure property 'fields' of 'undefined'" on load and on every theme switch. It stored the `withTheme()`-created `Form` component directly via `useState(withTheme(...))`/`setFormComponent(withTheme(...))`; now that `withTheme()` returns a plain function instead of a `forwardRef`-wrapped object, React's `typeof` check treats a bare function passed to `useState`/a state setter as a lazy initializer/updater and calls it with no arguments. Both call sites now wrap the value in `() => withTheme(...)`
- The playground's `FormComponent` is now derived with `useMemo(() => withTheme(themes[theme].theme), [themes, theme])` instead of being kept in its own `useState` and manually synced with the `theme` state on every selection. Removes the duplicated state, the `react/hook-use-state` lint suppression, and structurally rules out the `useState(withTheme(...))` crash class fixed above
- Bumped the root `@types/react` floor to `^19.2.18`: `SubmitEvent`, now part of the public `FormProps['onSubmit']` type, was only added to `@types/react` in that release — every earlier 19.2.x patch (verified 19.2.0 through 19.2.17) lacks it and fails to compile against `@rjsf/core`'s published types
- Removed a dead assertion in `Form.props.test.tsx` that waited for React 18's "Function components cannot be given refs" warning; verified via a standalone repro that React 19 emits no such warning for this case, so the branch could never run. The two sibling React-18-only console assertions in this file were already removed
