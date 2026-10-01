# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm run build-serial` builds sequentially; use it if the parallel `pnpm run build` causes issues.
- `pnpm run cs-check` / `pnpm run cs-format` run oxfmt once from the root over every file type it supports (versioned docs excluded). CI does not run `cs-check` — only the pre-commit hook formats staged files — so run `cs-format` yourself when committing without the hook (fresh worktree, `--no-verify`).
- `pnpm run test:update` fans out to the 9 packages that own snapshots (`@rjsf/snapshot-tests` for core's, plus the 8 themes); `cd packages/<pkg> && pnpm run test:update` updates one.

CI runs lint, knip, build, typecheck, and test in that order, so run those before pushing. Per-package `tsc` misses the test and playground projects; only the root `typecheck` covers them.

Each package build is one `tsdown -c ../../tsdown.base.mts` run: it emits per-file ESM and declarations into `lib/`, the only published output (the packages are ESM-only). It only transpiles; `pnpm run typecheck` is the typecheck, and tsc never emits JavaScript. It checks the repo as two programs: `tsconfig.typecheck.json` under `nodenext` (every package's `src` and tests, and `testing/`), and `tsconfig.typecheck-bundler.json` for chakra-ui, whose `@chakra-ui/react` declarations only resolve under `bundler`, and the playground, a Vite app that runs under a bundler's resolution and takes Vite's types from `src/vite-env.d.ts`. Both resolve `@rjsf/*` to source through the `@rjsf/source` export condition every package declares, so nothing has to be built first. Both carry the tests' Node and Vitest globals, so `no-restricted-globals`, `no-restricted-properties` (`globalThis.process`) and `no-restricted-imports` overrides in `.oxlintrc.json` are what keep the published packages' `src` off them and off Node's built-in modules, and another keeps the validators' `src` off the DOM's globals. What still gets through: type-only uses such as `NodeJS.Timeout` or `HTMLElement` in a validator, and ambient module declarations from any package's tests or from `vite/client` (`import.meta.env`, `*.css`, `*.svg`), which a published `src` sees too, so an import of a module its package doesn't depend on, such as `ajv-i18n` from `validator-ajv8/test/ajv-i18n.d.ts`, type-checks. Keep new code inside those two rather than adding a program per package: each program re-resolves the variance of the shared `T`/`S`/`F` type graph (`UiSchema` → `SlotComponent<…Props>` → `Registry` → `FieldProps` → `UiSchema`), about 1.5s and over 2M type instantiations apiece. The script passes `--checkers 2`: tsc's default is 4 per program whatever the core count, and both programs build at once, so 8 checkers peak around 10 GB, while 2 per program peak around 7 GB and are faster on CI's 4-vCPU runner. Pass `--checkers 1` (`pnpm run typecheck --checkers 1`) where memory is tighter still, about 5 GB. The per-package tsconfigs still drive tsdown's declarations and editors, and the root `tsconfig.json`, which references them, is only for editors: `pnpm run typecheck` doesn't build it.

## Architecture

When making a change to a widget or template, consider if the change should be generalized to all theme packages. If substantial logic is duplicated across themes, consider refactoring the logic to `@rjsf/utils` or `@rjsf/core`.

Check what `@rjsf/utils` already shares before writing theme logic, e.g. `enumOptionsSelectValue` / `enumOptionsDeselectValue` and the `useFileWidgetProps` / `useAltDateWidgetProps` hooks.

## Code style

- **TypeScript strict mode**, `esnext` target, `verbatimModuleSyntax` (type-only imports must be `import type`), relative imports include the `.ts`/`.tsx` extension
- Formatting is oxfmt (`.oxfmtrc.json`), linting is type-aware oxlint (`.oxlintrc.json`); the Husky + lint-staged pre-commit hook runs `oxlint --fix` and `oxfmt` on staged files
- `pnpm run lint` is one type-aware `oxlint` run from the root over the whole workspace, not an Nx target, so it is never cached; it peaks around 6 GB

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
