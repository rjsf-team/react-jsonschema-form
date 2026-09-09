# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages (parallel)
pnpm run build

# Build all packages (sequential, use if parallel causes issues)
pnpm run build-serial

# Run all tests
pnpm test

# Lint (oxlint, type-aware)
pnpm run lint

# Typecheck every package and its tests
pnpm run typecheck

# Dead code / unused dependency check
pnpm run knip

# Format check / format source files (oxfmt)
pnpm run cs-check
pnpm run cs-format

# Format check / format every file in the repo, including configs and markdown
pnpm run format-check
pnpm run format

# Run a single package's tests
cd packages/core && pnpm test

# Watch mode for a single package
cd packages/core && pnpm run test:watch

# Update snapshots
cd packages/snapshot-tests && pnpm run test:update

# Start the playground (interactive demo)
cd packages/playground && pnpm start

# Full sanity check (lint + knip + build + test)
pnpm run sanity-check
```

CI runs lint, knip, build, typecheck, and test in that order, so run those before pushing. Per-package `tsc` misses the test and playground projects; only the root `typecheck` covers them.

Individual package builds run `build:ts` (`tsc -b`, emits `lib/`) and then bundle `dist/` in three formats: `build:cjs` and `build:esm` via esbuild, `build:umd` via rollup.

## Architecture

This is an **pnpm workspaces + Nx** monorepo. All packages live under `packages/` and are scoped as `@rjsf/*`.

### Package roles

| Package                                                             | Role                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `@rjsf/utils`                                                       | Shared types, 80+ utility functions, schema helpers. No UI dependencies. |
| `@rjsf/core`                                                        | Core `Form` component, Bootstrap 3 as default theme, `withTheme()` HOC.  |
| `@rjsf/validator-ajv8`                                              | AJV 8-based validator. Exported via `customizeValidator()`.              |
| `@rjsf/snapshot-tests`                                              | Shared snapshot test suite consumed by all theme packages.               |
| Theme packages (`@rjsf/mui`, `@rjsf/antd`, `@rjsf/chakra-ui`, etc.) | UI-library-specific implementations of fields, widgets, and templates.   |
| `@rjsf/playground`                                                  | Vite app importing all themes, used for manual testing and demos.        |
| `@rjsf/docs`                                                        | Docusaurus documentation site.                                           |

### Registry pattern (the plugin system)

The `Registry` object is the core extension point passed to every field/widget/template:

```typescript
Registry = {
  fields, // Map of field type → Field component
  widgets, // Map of widget name → Widget component
  templates, // Layout/structural templates
  rootSchema, // Root JSON Schema
  formContext, // Arbitrary context object threaded to all components
  schemaUtils, // Schema parsing & validation helpers
  translateString,
  globalFormOptions, // Form-level options available to every template, field, and widget
  globalUiOptions, // Optional; global ui:options applied to every field
  uiSchemaDefinitions, // Optional; uiSchema fragments keyed by $ref path, applied when that $ref resolves
};
```

Override fields/widgets/templates per-form via props, or globally via `withTheme()`.

### Theme pattern

Every theme package follows the same structure:

1. Imports `withTheme` from `@rjsf/core`
2. Defines custom `Templates`, `Widgets`, and optionally `Fields`
3. Calls `withTheme({ templates, widgets, fields })` to produce a themed `Form`
4. Exports: `Form` (default), `Theme`, `Templates`, `Widgets`

### Field → Widget → Template hierarchy

- **Fields** handle schema-level logic (ObjectField, ArrayField, MultiSchemaField for oneOf/anyOf, etc.)
- **Widgets** handle individual input rendering (TextWidget, SelectWidget, CheckboxWidget, etc.)
- **Templates** control structural/layout rendering (FieldTemplate, ArrayFieldTemplate, ButtonTemplates, etc.)

Fields select which widget to render based on schema `type` and `ui:widget`. Templates wrap the output for consistent styling.

When making a change to a widget or template, consider if the change should be generalized to all theme packages. If substantial logic is duplicated across themes, consider refactoring the logic to `@rjsf/utils` or `@rjsf/core`.

### Form rendering flow

1. Caller provides `schema`, `validator` (required), `formData`, and `uiSchema`
2. `Form` creates `schemaUtils` from validator + schema
3. Schema is recursively decomposed into fields → widgets → templates
4. On change/blur: callbacks fire with updated `formData` and `errorSchema`
5. On submit: full validation runs, then `onSubmit` fires (or `onError` if invalid)

### Key `@rjsf/utils` exports to know

- Schema helpers: `findSchemaDefinition`, `mergeSchemas`, `getSchemaType`, `createSchemaUtils`
- Form data: `mergeDefaultsWithFormData`, `removeOptionalEmptyObjects`
- Error handling: `toErrorSchema`, `toErrorList`
- Enum helpers: `enumOptionsSelectValue`, `enumOptionsDeselectValue`
- React hooks: `useDeepCompareMemo`, `useFileWidgetProps`, `useAltDateWidgetProps`

## Code style

- **TypeScript strict mode**, `esnext` target, `verbatimModuleSyntax` (type-only imports must be `import type`), relative imports include the `.ts`/`.tsx` extension
- **oxfmt** (`.oxfmtrc.json`): single quotes, JSX single quotes, 120-char print width, sorted imports with React first
- **oxlint** (`.oxlintrc.json`): the `airbnb-typescript` rule set translated to oxlint, plus `typescript`, `react`, `jsx-a11y`, and `import` plugins; enforces curly braces, no-console, React rules of hooks
- **knip** (`knip.jsonc`): fails CI on unused files, exports, and dependencies
- Pre-commit hook (Husky + lint-staged) runs `oxlint --fix` and `oxfmt` on staged files

## Code comments

- Default to no comments. Write self-documenting code — clear names and structure — as the primary means of explanation.
- When a comment is warranted, explain the WHY (rationale, constraints, non-obvious tradeoffs), not the WHAT — well-named code already says what it does.
- Don't leave "before/after" or diff-style commentary in code comments or in this file. That belongs in commit messages and PR descriptions, not in code that has to keep reading true after the change ships.

## Changelog

- When adding an entry to `CHANGELOG.md`, append it as the last bullet under the relevant package's heading (e.g. `## @rjsf/daisyui`) — after the existing bullets, not inserted above or among them.

## Testing

- Vitest, jsdom, Testing Library; shared config in `testing/vitest.base.ts`, extended per package
- Tests resolve `@rjsf/*` imports to TypeScript source via the `@rjsf/source` export condition, so no build is needed before running them
- `@rjsf/utils` and the validator packages enforce 100% coverage
- Snapshot tests in `@rjsf/snapshot-tests` are shared across theme packages — run `test:update` there when changing core rendering
- Node ^22.18.0 || ^24.11.0 || >=26.0.0 required (active LTS lines only)
