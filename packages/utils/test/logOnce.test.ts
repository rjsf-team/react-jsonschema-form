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
  it('keeps remembering the messages it already has once there are LOG_ONCE_MAX_MESSAGES of them', () => {
    for (let i = 0; i < LOG_ONCE_MAX_MESSAGES; i += 1) {
      logOnce(`message ${i}`);
    }
    logOnce('message 0');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES);
    // Past the cap a message is logged every time, rather than the whole set being forgotten, which would make every
    // message it already holds log again too
    logOnce('a new message');
    logOnce('a new message');
    logOnce('message 0');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES + 2);
  });
  it('logs a message again after resetLogOnce()', () => {
    logOnce('a message');
    logOnce('a message');
    resetLogOnce();
    logOnce('a message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });
});
