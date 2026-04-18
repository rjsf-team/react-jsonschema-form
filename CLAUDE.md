# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Build all packages (parallel)
npm run build

# Build all packages (sequential, use if parallel causes issues)
npm run build-serial

# Run all tests
npm test

# Lint
npm run lint

# Prettier check / format
npm run cs-check
npm run cs-format

# Run a single package's tests
cd packages/core && npm test

# Watch mode for a single package
cd packages/core && npm run test:watch

# Update snapshots
cd packages/snapshot-tests && npm run test:update

# Start the playground (interactive demo)
cd packages/playground && npm start

# Full sanity check (lint + build + test)
npm run sanity-check
```

Individual package builds output three module formats: `build:cjs`, `build:esm`, `build:umd`.

## Architecture

This is an **npm workspaces + Nx** monorepo. All packages live under `packages/` and are scoped as `@rjsf/*`.

### Package roles

| Package | Role |
|---|---|
| `@rjsf/utils` | Shared types, 80+ utility functions, schema helpers. No UI dependencies. |
| `@rjsf/core` | Core `Form` component, Bootstrap 3 as default theme, `withTheme()` HOC. |
| `@rjsf/validator-ajv8` | AJV 8-based validator. Exported via `customizeValidator()`. |
| `@rjsf/snapshot-tests` | Shared snapshot test suite consumed by all theme packages. |
| Theme packages (`@rjsf/mui`, `@rjsf/antd`, `@rjsf/chakra-ui`, etc.) | UI-library-specific implementations of fields, widgets, and templates. |
| `@rjsf/playground` | Vite app importing all themes, used for manual testing and demos. |
| `@rjsf/docs` | Docusaurus documentation site. |

### Registry pattern (the plugin system)

The `Registry` object is the core extension point passed to every field/widget/template:

```typescript
Registry = {
  fields,        // Map of field type → Field component
  widgets,       // Map of widget name → Widget component
  templates,     // Layout/structural templates
  rootSchema,    // Root JSON Schema
  formContext,   // Arbitrary context object threaded to all components
  schemaUtils,   // Schema parsing & validation helpers
  translateString,
  globalFormOptions,
}
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

- **TypeScript strict mode**, ES2020 target
- **Prettier**: single quotes, JSX single quotes, 120-char print width
- **ESLint**: enforces semicolons, curly braces, no-console, React Hooks rules
- Pre-commit hook (Husky + lint-staged) auto-formats and lints staged files

## Testing

- Jest + `@swc/jest` (fast transpilation), jsdom, Testing Library
- Snapshot tests in `@rjsf/snapshot-tests` are shared across theme packages — run `test:update` there when changing core rendering
- Node >=20 required
