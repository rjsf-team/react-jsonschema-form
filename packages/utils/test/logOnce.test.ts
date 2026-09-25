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
  it('forgets every message it remembers once there are LOG_ONCE_MAX_MESSAGES of them', () => {
    for (let i = 0; i < LOG_ONCE_MAX_MESSAGES; i += 1) {
      logOnce(`message ${i}`);
    }
    logOnce('message 0');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES);
    logOnce('a new message');
    logOnce('message 0');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES + 2);
  });
  it('remembers messages separately for each scope', () => {
    const scopeA = {};
    const scopeB = {};
    logOnce('a message', 'warn', undefined, scopeA);
    logOnce('a message', 'warn', undefined, scopeA);
    logOnce('a message', 'warn', undefined, scopeB);
    logOnce('a message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    logOnce('a message', 'error', 42, scopeB);
    expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith('a message', 42);
  });
  it('logs a message again after resetLogOnce()', () => {
    const scope = {};
    logOnce('a message');
    logOnce('a message', 'warn', undefined, scope);
    resetLogOnce();
    logOnce('a message');
    logOnce('a message', 'warn', undefined, scope);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(4);
  });
});
