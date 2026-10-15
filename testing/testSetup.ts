import '@testing-library/jest-dom/vitest';
import { mockResizeObserver } from 'jsdom-testing-mocks';

// Imported by path rather than as `@rjsf/utils`, which isn't resolvable from here; it's the same source file the tests
// resolve `@rjsf/utils` to, so it shares the module instance whose logged messages need clearing.
import { resetLogOnce } from '../packages/utils/src/logOnce.ts';

// Installs a ResizeObserver mock globally. jsdom doesn't implement ResizeObserver;
// this stub prevents "ResizeObserver is not defined" errors across all packages.
// Skipped in node-environment test files, which have no window to mock.
if (typeof window !== 'undefined') {
  mockResizeObserver();
}

// logOnce() only logs a message the first time it's seen, so without this a test asserting on a warning would pass or
// fail depending on whether an earlier test in the same file had already triggered it.
beforeEach(resetLogOnce);

// `retrieveSchema()` stamps every subschema it hands out with a private symbol recording where it came from. A schema a
// test writes out by hand cannot name that symbol, so equality compares a stamped schema as the schema without it. The
// symbol is private to `@rjsf/utils`, so it is found by its description.
function withoutProvenance(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  const stamp = Object.getOwnPropertySymbols(value).find((symbol) => symbol.description === '__rjsf_provenance');
  if (stamp === undefined) {
    return value;
  }
  const copy = { ...value };
  Reflect.deleteProperty(copy, stamp);
  return copy;
}

expect.addEqualityTesters([
  function equalsWithoutProvenance(a, b, customTesters) {
    const unstampedA = withoutProvenance(a);
    const unstampedB = withoutProvenance(b);
    return unstampedA === a && unstampedB === b ? undefined : this.equals(unstampedA, unstampedB, customTesters);
  },
]);
