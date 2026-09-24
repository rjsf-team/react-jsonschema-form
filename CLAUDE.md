# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm run build-serial` builds sequentially; use it if the parallel `pnpm run build` causes issues.
- `pnpm run test:update` fans out to the 9 packages that own snapshots; `cd packages/<pkg> && pnpm run test:update` updates one.

CI runs lint, knip, build, typecheck, and test in that order, so run those before pushing. Per-package `tsc` misses the test and playground projects; only the root `typecheck` covers them.

Each package build is one `tsdown -c ../../tsdown.base.mts` run: it emits per-file ESM and declarations into `lib/`, the only published output (the packages are ESM-only). It only transpiles; `pnpm run typecheck` (`tsc --build`) is the typecheck, and tsc never emits JavaScript.

## Architecture

When making a change to a widget or template, consider if the change should be generalized to all theme packages. If substantial logic is duplicated across themes, consider refactoring the logic to `@rjsf/utils` or `@rjsf/core`.

## Code style

- **TypeScript strict mode**, `esnext` target, `verbatimModuleSyntax` (type-only imports must be `import type`), relative imports include the `.ts`/`.tsx` extension

## Code comments

- Default to no comments. Write self-documenting code — clear names and structure — as the primary means of explanation.
- When a comment is warranted, explain the WHY (rationale, constraints, non-obvious tradeoffs), not the WHAT — well-named code already says what it does.
- Don't leave "before/after" or diff-style commentary in code comments or in this file. That belongs in commit messages and PR descriptions, not in code that has to keep reading true after the change ships.

## Changelog

- When adding an entry to `CHANGELOG.md`, append it as the last bullet under the relevant package's heading (e.g. `## @rjsf/daisyui`) — after the existing bullets, not inserted above or among them.

## Testing

- Before writing, converting, or debugging tests, load the `rjsf-testing` skill (`.claude/skills/rjsf-testing/SKILL.md`): test helpers, user-event vs `fireEvent` rules, fake-timer and snapshot gotchas.
- Never relax an assertion to make a conversion work — keep `fireEvent` and say why instead.
- `@rjsf/utils` and the validator packages enforce 100% coverage
