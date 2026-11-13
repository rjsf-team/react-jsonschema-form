import type { MockInstance } from 'vitest';

import { noop } from '../src/index.ts';
import logGridSpanWarning from '../src/logGridSpanWarning.ts';

describe('logGridSpanWarning()', () => {
  let consoleWarnSpy: MockInstance;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('logs nothing without a span', () => {
    logGridSpanWarning('root', undefined, { ownWidth: 'a `size`', wholeSpansOnly: true });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("logs that a span is ignored beside the column's own width, half step or not", () => {
    logGridSpanWarning('root_a', 4.5, { ownWidth: 'a `size`', wholeSpansOnly: true });
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` in "root_a" is ignored, since the column has a `size` of its own',
    );
  });

  it('logs a half step where the grid needs whole spans', () => {
    logGridSpanWarning('root_b', 4.5, { wholeSpansOnly: true });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` of 4.5 in "root_b" is not a whole number, which this theme\'s grid needs',
    );
  });

  it('logs nothing for a half step where the grid takes one, or for a whole span', () => {
    logGridSpanWarning('root_c', 4.5);
    logGridSpanWarning('root_c', 4, { wholeSpansOnly: true });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
