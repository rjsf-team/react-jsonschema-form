import type { MockInstance } from 'vitest';

export interface ConsoleSuppressionResult {
  readonly consoleSpy: MockInstance;
}

// React's invokeGuardedCallback (dev mode) re-throws render errors by dispatching a synthetic
// DOM event on a fake node. jsdom catches that throw and calls reportException(), which fires
// an ErrorEvent on window and — if unhandled — forwards it to the virtualConsole, producing
// "Error: ..." lines in vitest's stderr. Calling event.preventDefault() marks the error as
// handled, stopping both the virtualConsole output and any uncaughtException emission.
//
// We also keep a file-level console.error spy so individual tests can assert on React's
// "The above error occurred in the <Component> component" messages without creating per-test
// spies that call mockRestore() — which would silently kill the file-level spy for every
// subsequent test in the file.
//
// Call this once at the top of a test file or describe block (not inside a test).
// The returned object's `consoleSpy` getter is safe to access inside test bodies.
export function setupConsoleErrorSuppression(): ConsoleSuppressionResult {
  let spy: MockInstance;

  function handleWindowError(event: ErrorEvent): void {
    if (event.error instanceof Error) {
      event.preventDefault();
    }
  }

  beforeAll(() => {
    spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.addEventListener('error', handleWindowError);
  });
  beforeEach(() => {
    spy.mockClear();
  });
  afterAll(() => {
    window.removeEventListener('error', handleWindowError);
    spy.mockRestore();
  });

  return {
    get consoleSpy() {
      return spy;
    },
  };
}

// Companion to setupConsoleErrorSuppression for tests that produce expected console.warn
// output. console.warn calls go directly through the spy (no jsdom/window involvement),
// so no window event listener is needed here.
//
// Call this once at the top of a test file or describe block (not inside a test).
// The returned object's `consoleSpy` getter is safe to access inside test bodies.
export function setupConsoleWarnSuppression(): ConsoleSuppressionResult {
  let spy: MockInstance;

  beforeAll(() => {
    spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  beforeEach(() => {
    spy.mockClear();
  });
  afterAll(() => {
    spy.mockRestore();
  });

  return {
    get consoleSpy() {
      return spy;
    },
  };
}
