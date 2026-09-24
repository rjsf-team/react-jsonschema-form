import type { MockInstance } from 'vitest';

import { logOnce, logOnceInScope, noop, resetLogOnce } from '../src/index.ts';
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
  it('passes additional args through to the console', () => {
    const error = new Error('boom');
    logOnce('a message:', 'warn', error, 42);
    expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a message:', error, 42);
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
  it('logs the same message separately for distinct args', () => {
    logOnce('a message:', 'warn', new Error('first'));
    logOnce('a message:', 'warn', new Error('second'));
    logOnce('a message:', 'warn', new Error('second'));
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });
  it('logs the same message separately for distinct object args', () => {
    logOnce('a message:', 'warn', { a: 1 });
    logOnce('a message:', 'warn', { b: 2 });
    logOnce('a message:', 'warn', { b: 2 });
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });
  it('compares objects that String() cannot convert by their content', () => {
    const nullPrototype = Object.assign(Object.create(null), { a: 1 });
    const throwingToString = {
      toString() {
        throw new Error('no string for you');
      },
    };
    expect(() => {
      logOnce('a message:', 'error', nullPrototype);
      logOnce('a message:', 'error', nullPrototype);
      logOnce('a message:', 'error', throwingToString);
    }).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
  });
  it('always logs, without throwing, when an arg cannot be converted for comparison', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const unprintableError = new Error('boom');
    unprintableError.toString = () => {
      throw new Error('no string for you');
    };
    expect(() => {
      logOnce('a message:', 'error', circular);
      logOnce('a message:', 'error', circular);
      logOnce('a message:', 'error', unprintableError);
      logOnce('a message:', 'error', unprintableError);
    }).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
    expect(consoleErrorSpy).toHaveBeenCalledWith('a message:', circular);
  });
  it('compares a cross-realm Error by its String() form, not as an empty object', () => {
    const crossRealmError = (message: string) =>
      Object.assign(Object.create({ [Symbol.toStringTag]: 'Error', toString: () => `Error: ${message}` }), {});
    logOnce('a message:', 'warn', crossRealmError('first'));
    logOnce('a message:', 'warn', crossRealmError('second'));
    logOnce('a message:', 'warn', crossRealmError('second'));
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });
  it('compares objects with no readable content by identity', () => {
    const map = new Map([['a', 1]]);
    logOnce('a message:', 'warn', map);
    logOnce('a message:', 'warn', map);
    logOnce('a message:', 'warn', new Map([['b', 2]]));
    logOnce('a message:', 'warn', new Set([1]));
    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
  });
  it('forgets its least recently seen message once it has remembered LOG_ONCE_MAX_MESSAGES of them', () => {
    for (let i = 0; i < LOG_ONCE_MAX_MESSAGES; i++) {
      logOnce(`message ${i}`);
    }
    logOnce('message 0');
    logOnce('a new message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES + 1);
    logOnce('message 0');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES + 1);
    logOnce('message 1');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES + 2);
  });
  it('remembers messages separately for each scope', () => {
    const scopeA = {};
    const scopeB = {};
    logOnceInScope(scopeA, 'a message');
    logOnceInScope(scopeA, 'a message');
    logOnceInScope(scopeB, 'a message');
    logOnce('a message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    logOnceInScope(scopeB, 'a message', 'error', 42);
    expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith('a message', 42);
  });
  it('logs a message again after resetLogOnce()', () => {
    const scope = {};
    logOnce('a message');
    logOnceInScope(scope, 'a message');
    resetLogOnce();
    logOnce('a message');
    logOnceInScope(scope, 'a message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(4);
  });
});
