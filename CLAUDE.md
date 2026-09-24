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

# Run a single package's tests
cd packages/core && pnpm test

# Watch mode for a single package
cd packages/core && pnpm run test:watch

# Update snapshots (fans out to the 9 packages that own snapshots)
pnpm run test:update

# Update a single package's snapshots
cd packages/mui && pnpm run test:update

# Start the playground (interactive demo)
cd packages/playground && pnpm start

# Full sanity check (lint + knip + build + test)
pnpm run sanity-check
```

CI runs lint, knip, build, typecheck, and test in that order, so run those before pushing. Per-package `tsc` misses the test and playground projects; only the root `typecheck` covers them.

Each package build is one `tsdown -c ../../tsdown.base.mts` run: it emits per-file ESM and declarations into `lib/`, the only published output (the packages are ESM-only). It only transpiles; `pnpm run typecheck` (`tsc --build`) is the typecheck, and tsc never emits JavaScript.

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
- Form data: `mergeDefaultsWithFormData`, `omitExtraData`
- Error handling: `toErrorSchema`, `toErrorList`
- Enum helpers: `enumOptionsSelectValue`, `enumOptionsDeselectValue`
- React hooks: `useFileWidgetProps`, `useAltDateWidgetProps`

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
- Build on the existing test helpers rather than hand-rolling the same setup. `packages/core/test/testUtils.tsx` holds most of them and is the first place to look before writing scaffolding:
  - `createFormComponent(props)` renders a `Form` with the AJV 8 validator wired up and returns `{ node, onChange, onSubmit, onError, rerender }`; `createComponent` does the same for a themed `Form`, and `createFormRef` covers the `FormHandle` cases
  - `submitForm(node, user)` submits through the real submit button, falling back to `fireEvent.submit` when there isn't one. Its third argument, `forceFireEvent`, is the escape hatch for a test where clicking would focus the button and blur a focused field first, or where the browser's own constraint validation would block the submit the test means to make — pass it deliberately and say why
  - `fieldErrorsById(node)`, `errorListMessages(node)` and `expectToHaveBeenCalledWithFormData(mock, formData)` for assertions; `getSelectedOptionValue(select)` for a `<select>`'s rendered text
  - `setupConsoleErrorSuppression()` / `setupConsoleWarnSuppression()` for a test that intentionally triggers a console error, instead of an ad-hoc `vi.spyOn(console, ...)`
  - `describeRepeated(title, fn)` runs a block against both the plain and the `omitExtraData` form variants
- A theme package testing a widget or template directly (not through a `Form`) builds its registry with `getTestRegistry()` from `@rjsf/core/testing`, which takes optional `rootSchema`, `fields`, `templates` and `widgets`. Pass the theme's own `Templates` when the assertion depends on the theme rendering — the default builds core's registry, so a test that omits them is exercising core's components, not the theme's
- Drive interactions with `@testing-library/user-event`, not `fireEvent` — it dispatches the full event sequence a real interaction produces, so a test can't pass on an event a user could never fire on their own. It's a root `devDependency`; don't add it to a package:

  ```ts
  import { userEvent } from '@testing-library/user-event';

  const user = userEvent.setup(); // module level, after the imports
  ```

  One instance per file is the convention here, but it carries pointer and keyboard state across every test in
  that file. A test that presses without releasing — `user.keyboard('{Shift>}')`, `user.pointer({ keys: '[MouseLeft>]' })`
  — leaks that held key or button into the tests after it, which then silently get shift-clicks they never
  asked for. Release it in the same test, or set `user` up in a `beforeEach` so each test starts clean.

  Then `await user.click(...)`, `await user.type(...)`, `await user.selectOptions(...)`, `await user.clear(...)`, and make the enclosing `test`/`it` callback `async`. A theme's `Select` is usually a custom combobox rather than a native `<select>`, so click the option rather than reaching for `selectOptions`.

- `user.type()` is not the only way to set a value, and reaching for `fireEvent` the moment it misbehaves is the common mistake. `await user.click(input)` followed by `await user.paste(value)` sets the whole value in a single input event, which is what you want whenever per-keystroke behavior gets in the way: jsdom's value sanitization for `date`/`time`/`datetime-local` inputs rejecting intermediate characters, an assertion counting `onChange` calls, or a controlled input whose `value` prop never updates and so reverts each keystroke. `user.upload()` covers `type=file`. See `packages/core/test/StringField.test.tsx` for both
- `fireEvent` stays correct in a few places. Give every one you write or keep a comment saying why, so the next reader doesn't "fix" it back — a handful of older calls in `@rjsf/core` predate this and still lack one, so treat an uncommented call as unreviewed rather than as a precedent. Reach for it only when user-event genuinely can't express the interaction, and confirm that's true rather than assuming it:
  - user-event's own input model can't produce the value, whatever you drive it with. It only edits the types in its `editableInputTypes` list (text, date, datetime-local, email, month, number, password, search, tel, time, url, week), so `click` + `paste` on a `type=color` input silently does nothing. And every edit to a `type=time` input is rebuilt by its `buildTimeValue`, which strips non-digits and caps the result at `HH:MM` — `'11:10:12'` becomes `'11:59'` — so a seconds-precision time can only be set with `fireEvent.change`. Note that `tabIndex={-1}` is *not* a case of this: it only removes an element from the tab order, and a click still focuses it in a browser and in user-event, so `user.click()` followed by `user.keyboard('{Enter}')` reaches a `tabIndex={-1}` element's own `onKeyDown` guard
  - a widget rendered with a fixed `value` that never updates, where the re-render after each click reverts the last one — a multiple `<select>` needs its options selected together and reported in one change
  - a component whose behavior depends on the interaction being synchronous. Mantine's `Select` is the live example: its dropdown applies floating-ui's `hide()` middleware, jsdom lays every element out at zero size, and any `await` lets that recomputation set `display: none` so `getByRole('option')` finds nothing
  - `fireEvent.submit` when clicking the real button would focus it, blurring the focused field and firing `onChange` before submit; `submitForm` in `packages/core/test/testUtils.tsx` takes a `forceFireEvent` flag for exactly this
- Never relax an assertion to make a conversion work — keep `fireEvent` and say why instead. Watch for assertions that quietly stop testing anything: a negative one (`expect(onChange).not.toHaveBeenCalled()`) passes just as happily when the event never reached the element, and an `expect(...).not.toThrow()` wrapping a now-`async` body can't just become `await expect(promise).resolves.not.toThrow()` — React routes an error thrown inside a handler to a window `error` event rather than rejecting the promise user-event returns, so that form passes either way. Assert on a window `error` listener instead, as `packages/daisyui/test/DateTimeWidget.test.tsx` does
- user-event hangs under Vitest's fake timers, and neither `advanceTimers` nor `delay: null` avoids it — the wait isn't user-event's. `@testing-library/react`'s `asyncWrapper` drains the microtask queue with a `setTimeout(resolve, 0)` after every user-event call, and only pumps the clock when it sees a global `jest`, which Vitest doesn't define. With the timer functions faked, that `setTimeout` never fires. A test that only needs the clock pinned should fake `Date` alone: `vi.useFakeTimers({ toFake: ['Date'] })`
- `@rjsf/utils` and the validator packages enforce 100% coverage
- Snapshot tests in `@rjsf/snapshot-tests` are shared across theme packages, but the snapshots themselves live in each consuming package (`@rjsf/core` plus the 8 themes); that package has no `test:update` of its own. Changing a shared case or core rendering means running `pnpm run test:update` from the root, then reviewing all 9 diffs
- Node ^22.18.0 || ^24.11.0 || >=26.0.0 required (active LTS lines only)
