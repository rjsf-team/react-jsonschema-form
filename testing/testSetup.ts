import '@testing-library/jest-dom';
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
beforeEach(() => {
  resetLogOnce();
});
