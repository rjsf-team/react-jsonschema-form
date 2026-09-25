import type { MockInstance } from 'vitest';

import { logOnce, noop, resetLogOnce } from '../src/index.ts';
import { LOG_ONCE_MAX_MESSAGES } from '../src/logOnce.ts';

describe('logOnce()', () => {
  let consoleWarnSpy: MockInstance;
  let consoleErrorSpy: MockInstance;
  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
  });
  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  it('warns by default', () => {
    logOnce('a message');
    expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a message');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('logs an error when asked to', () => {
    logOnce('a message', 'error');
    expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith('a message');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
  it('passes the error through to the console', () => {
    const error = new Error('boom');
    logOnce('a message:', 'warn', error);
    expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a message:', error);
  });
  it('does not repeat a message it has already logged', () => {
    logOnce('a message');
    logOnce('a message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });
  it('logs the same message separately at each level', () => {
    logOnce('a message');
    logOnce('a message', 'error');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
  it('logs the same message separately for distinct errors', () => {
    logOnce('a message:', 'warn', new Error('first'));
    logOnce('a message:', 'warn', new Error('second'));
    logOnce('a message:', 'warn', new Error('second'));
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });
  it('remembers a message, without throwing, when the error cannot be converted for comparison', () => {
    const nullPrototype = Object.assign(Object.create(null), { a: 1 });
    const unprintableError = new Error('boom');
    unprintableError.toString = () => {
      throw new Error('no string for you');
    };
    expect(() => {
      logOnce('a message:', 'error', nullPrototype);
      logOnce('a message:', 'error', nullPrototype);
      logOnce('another message:', 'error', unprintableError);
      logOnce('another message:', 'error', unprintableError);
      // Falling back to the error's type means this one can't be told apart from the `nullPrototype` above
      logOnce('a message:', 'error', unprintableError);
    }).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith('a message:', nullPrototype);
    expect(consoleErrorSpy).toHaveBeenCalledWith('another message:', unprintableError);
  });
  it('tells an absent error apart from one that converts to an empty string', () => {
    logOnce('a message');
    logOnce('a message', 'warn', '');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });
  it('remembers a message first seen after LOG_ONCE_MAX_MESSAGES others have been', () => {
    for (let i = 0; i < LOG_ONCE_MAX_MESSAGES; i += 1) {
      logOnce(`one-off ${i}`);
    }
    for (let i = 0; i < 50; i += 1) {
      logOnce('a new message');
    }
    // Remembering only the first LOG_ONCE_MAX_MESSAGES would log this on every one of those 50 renders: keys holding a
    // per-row id or index, or another tenant's form under SSR, fill the cap with messages that never recur
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES + 1);
  });
  it('logs a working set larger than LOG_ONCE_MAX_MESSAGES once per message, not once per pass', () => {
    const workingSetSize = LOG_ONCE_MAX_MESSAGES + 1;
    for (let pass = 0; pass < 3; pass += 1) {
      for (let i = 0; i < workingSetSize; i += 1) {
        logOnce(`message ${i}`);
      }
    }
    // Forgetting every message at the cap, or evicting the least recently seen one, would log all of them on all three
    // passes instead
    expect(consoleWarnSpy).toHaveBeenCalledTimes(workingSetSize);
  });
  it('keeps remembering a message while the ones seen after it fill a single generation', () => {
    logOnce('a steady message');
    for (let i = 0; i < LOG_ONCE_MAX_MESSAGES; i += 1) {
      logOnce(`one-off ${i}`);
    }
    logOnce('a steady message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES + 1);
  });
  it('logs a message again once two generations of others have displaced it', () => {
    logOnce('a steady message');
    for (let i = 0; i < LOG_ONCE_MAX_MESSAGES * 2; i += 1) {
      logOnce(`one-off ${i}`);
    }
    logOnce('a steady message');
    // The price of keeping the two generations bounded: a message that outlives them is logged a second time. Holding
    // it instead would cost a slot in every generation, shrinking how large a working set the test above can dedupe
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES * 2 + 2);
  });
  it('logs a message again after resetLogOnce()', () => {
    logOnce('a message');
    logOnce('a message');
    resetLogOnce();
    logOnce('a message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });
});
