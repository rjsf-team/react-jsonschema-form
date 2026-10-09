# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm run build-serial` builds sequentially; use it if the parallel `pnpm run build` causes issues.
- `pnpm run cs-check` / `pnpm run cs-format` run oxfmt once from the root over every file type it supports (versioned docs excluded). CI runs `cs-check` but nothing in CI formats, so run `cs-format` yourself when committing without the pre-commit hook (fresh worktree, `--no-verify`).
- `pnpm run test:update` fans out to the 9 packages that own snapshots (`@rjsf/snapshot-tests` for core's, plus the 8 themes); `cd packages/<pkg> && pnpm run test:update` updates one.

CI is two jobs. `checks` runs `pnpm dedupe --check`, `cs-check`, lint (which is also the typecheck) and knip in that order, once, on Node 24 — none of them depends on the Node version or on a build. `build` runs the build and then the tests on Node 22, 24 and 26. `pnpm run sanity-check` runs all of that locally except `pnpm dedupe --check`, which the pre-commit hook already runs on a staged `pnpm-lock.yaml`. The per-package configs are build-only (see below).

Each package build is one `tsdown -c ../../tsdown.base.mts` run: it emits per-file ESM and declarations into `lib/`, the only published output (the packages are ESM-only). It doesn't typecheck: its declaration build runs `tsgo --noCheck`. `pnpm run lint` (`oxlint --type-check`) is the typecheck as well as the lint, and nothing else runs tsc. It checks the repo as two programs: `tsconfig.typecheck.json` under `nodenext` (every package's `src` and tests, and `testing/`), and `tsconfig.typecheck-bundler.json` for chakra-ui, whose `@chakra-ui/react` declarations only resolve under `bundler`, and the playground, a Vite app that runs under a bundler's resolution and takes Vite's types from `src/vite-env.d.ts`. Both resolve `@rjsf/*` to source through the `@rjsf/source` export condition every package declares, so nothing has to be built first. Both carry the tests' Node and Vitest globals, so `no-restricted-globals`, `no-restricted-properties` (`globalThis.process`) and `no-restricted-imports` overrides in `.oxlintrc.json` are what keep the published packages' `src` off them and off Node's built-in modules, and another keeps the validators' `src` off the DOM globals it lists (`document`, `window`, `navigator`, the common constructors such as `HTMLElement`, `DOMParser` and `XMLHttpRequest`, and `globalThis.document`/`globalThis.window`). What still gets through: type-only uses such as `NodeJS.Timeout` or `HTMLElement`, any DOM global a validator reaches under a name that list doesn't ban (`HTMLInputElement`, `MutationObserver`, `globalThis.navigator`), and ambient module declarations from any package's tests or from `vite/client` (`import.meta.env`, `*.css`, `*.svg`), which a published `src` sees too, so an import of a module its package doesn't depend on, such as `ajv-i18n` from `validator-ajv8/test/ajv-i18n.d.ts`, type-checks. Keep new code inside those two rather than adding a program per package: each program re-resolves the variance of the shared `T`/`S`/`F` type graph (`UiSchema` → `SlotComponent<…Props>` → `Registry` → `FieldProps` → `UiSchema`), about 1.5s and over 2M type instantiations apiece. The root `tsconfig.json` only references those two programs. Lint and editors open the nearest `tsconfig.json` and use the first referenced program that contains the file. A `tsconfig.json` inside a package would be found first and become a program of its own, re-resolving the type graph again and slowing lint by that much. Lint reports each file's type errors from that one program, so a theme's `src`, which the bundler program also loads through the playground, is type-checked only under `nodenext`, and a path in `.oxlintrc.json`'s `ignorePatterns` is neither linted nor type-checked. Each package's `tsconfig.lib.json` just extends `tsconfig.base.json` (chakra-ui adds bundler resolution) and is read only by tsdown, whose declaration build (`tsgo --noCheck`) takes the package directory from that file's location; it doesn't typecheck.

## Architecture

When making a change to a widget or template, consider if the change should be generalized to all theme packages. If substantial logic is duplicated across themes, consider refactoring the logic to `@rjsf/utils` or `@rjsf/core`.

Check what `@rjsf/utils` already shares before writing theme logic, e.g. `enumOptionsSelectValue` / `enumOptionsDeselectValue` and the `useFileWidgetProps` / `useAltDateWidgetProps` hooks.

## Code style

- **TypeScript strict mode**, `esnext` target, `verbatimModuleSyntax` (type-only imports must be `import type`), relative imports include the `.ts`/`.tsx` extension
- Formatting is oxfmt (`.oxfmtrc.json`), linting is type-aware oxlint (`.oxlintrc.json`); the Husky + lint-staged pre-commit hook runs `oxlint --fix` and `oxfmt` on staged files
- `pnpm run lint` is one `oxlint --type-check` run from the root over the whole workspace, not an Nx target, so it is never cached; it peaks around 7 GB, and a lower `GOMAXPROCS` slows it without saving much memory. It is also the typecheck (see Commands). The pre-commit hook's `oxlint --fix` runs the type-aware rules but not `--type-check`, so a commit isn't type-checked

## Code comments

- Default to no comments. Write self-documenting code — clear names and structure — as the primary means of explanation.
- When a comment is warranted, explain the WHY (rationale, constraints, non-obvious tradeoffs), not the WHAT — well-named code already says what it does.
- Don't leave "before/after" or diff-style commentary in code comments or in this file. That belongs in commit messages and PR descriptions, not in code that has to keep reading true after the change ships.

## Changelog

- When adding an entry to `CHANGELOG.md`, append it as the last bullet under the relevant package's heading (e.g. `## @rjsf/daisyui`) — after the existing bullets, not inserted above or among them.

## Testing

- Load the `rjsf-testing` skill (`.claude/skills/rjsf-testing/SKILL.md`) whenever you write or modify a test — including a regression test added as part of a bug fix. It covers the test helpers, when `fireEvent` is still correct, and the fake-timer and snapshot gotchas.
- Tests resolve `@rjsf/*` imports to TypeScript source, so no build is needed before running them.
- Drive interactions with `@testing-library/user-event`, not `fireEvent`. Every `fireEvent` that remains needs a comment saying why user-event can't express the interaction, and an assertion is never weakened to make a `fireEvent` → user-event conversion pass.
- user-event hangs under Vitest's fake timers; fake only the clock with `vi.useFakeTimers({ toFake: ['Date'] })`.
- `@rjsf/utils` and the validator packages enforce 100% coverage
