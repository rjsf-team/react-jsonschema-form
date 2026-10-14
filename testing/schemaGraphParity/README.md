# Schema graph parity harness

These suites record what v7 does on recursive and conditional schemas, so that the staged move to a parsed schema graph
(the RFC "Parse each schema once into a graph and build the form from a field tree") changes that behaviour only where
it means to.

## What is recorded

The corpus is shared by both suites and lives here:

- `recursionShapes.ts`: the 65 recursive shapes the RFC's prototype was compared with v7 on.
- `terminationShapes.ts`: the termination families (`lcm(2,3)`, `deepChain(8)`, `depChain(9)`, the `if` and option
  flips, the percent-encoded aliases), the dense definition graphs `K3` to `K5` and the A/B/C shared-node schema.
- `capturedShapes.ts`: every schema with a `$ref` cycle that the utils and core test suites and the playground samples
  resolved, re-rooted at each definition and with a `populateDefaults` variant where it has an `allOf`, followed by
  the data and Expand-click cases those tests pin. Each shape's `source` names the test it came from.

Each shape has a baseline file per suite, named after the shape:

- `packages/utils/test/schemaGraphParity/__baselines__/<family>/<shape>.txt`: `retrieveSchema`'s output, with
  `RJSF_REF_KEY`, `RJSF_REF_CYCLE_KEY`, `ADDITIONAL_PROPERTY_FLAG` and `GUESSED_TYPE_FLAG` printed as `@@` keys,
  and `retrieveSchema` run again on that output; and `getDefaultFormState` under the default behaviour,
  `allOf: 'populateDefaults'` and `emptyObjectFields: 'skipEmptyDefaults'`, each fed its own result five more times,
  with the serialized length of every pass, so a result that grows shows. Every `if` and option matches here, as in
  the other utils schema tests; a populate variant records nothing of its own, since every preset already runs.
- `packages/core/test/schemaGraphParity/__baselines__/<family>/<shape>.txt`: the same six `getDefaultFormState`
  passes under AJV with the shape's own behaviour, and a rendered `Form`'s control ids and Expand Cycle buttons,
  before and after one click on the first Expand button (or the clicks or option selection the shape names).

A schema output larger than 50 kB is recorded as its length and SHA-256. An error other than a stack overflow is
recorded as `throws`.

## Pending surfaces

`pending.ts` lists each surface v7 cannot produce: a stack overflow, a worker that runs out of memory, or a call that
takes seconds. Running one would fail the suite or kill its worker, so the suites list it as `it.todo`, with v7's
failure in the title. A stage that makes a surface run removes its entry, records the new baseline and adds an
`ALLOWLIST.md` entry for it.

## The gate

Any change to a baseline file needs an entry in `ALLOWLIST.md` naming the shape, the suite, the RFC section and the
`CHANGELOG-v7.md` line that justify it. A change without one is a regression, whatever the new value looks like.
Regenerate the baselines with `pnpm exec vitest run test/schemaGraphParity -u` in `packages/utils` or
`packages/core`, and review the diff against the allowlist before committing. CI never writes a missing baseline, so a
renamed or new shape fails until its file is committed.
