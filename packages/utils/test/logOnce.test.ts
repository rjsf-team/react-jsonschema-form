import type { MockInstance } from 'vitest';

import { logOnce, noop, resetLogOnce, RJSFWarningError, setWarningOptions } from '../src/index.ts';
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
  it('logs the same message separately for distinct plain-object and non-Error payloads', () => {
    logOnce('a message:', 'warn', { a: 1 });
    logOnce('a message:', 'warn', { a: 2 });
    logOnce('a message:', 'warn', { a: 2 });
    logOnce('a message:', 'warn', /first/);
    logOnce('a message:', 'warn', /second/);
    logOnce('a message:', 'warn', { cause: new Error('first') });
    logOnce('a message:', 'warn', { cause: new Error('second') });
    expect(consoleWarnSpy).toHaveBeenCalledTimes(6);
  });
  it('remembers a message, without throwing, when the error cannot be converted for comparison', () => {
    const nullPrototype: Record<string, unknown> = {};
    Object.setPrototypeOf(nullPrototype, null);
    nullPrototype.self = nullPrototype;
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
  it('tells an error that converts to the same text apart from a string error, by its type', () => {
    const unprintableError = new Error('boom');
    unprintableError.toString = () => {
      throw new Error('no string for you');
    };
    logOnce('a message:', 'error', unprintableError);
    logOnce('a message:', 'error', 'object');
    logOnce('a message:', 'error', 10);
    logOnce('a message:', 'error', '10');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
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
    // Keys holding a per-row id or index, or another tenant's form under SSR, fill the cap with messages that never
    // recur, so one first seen after the cap is full still has to be deduped across the renders that follow
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES + 1);
  });
  it('logs a working set larger than LOG_ONCE_MAX_MESSAGES once per message, not once per pass', () => {
    const workingSetSize = LOG_ONCE_MAX_MESSAGES + 1;
    for (let pass = 0; pass < 3; pass += 1) {
      for (let i = 0; i < workingSetSize; i += 1) {
        logOnce(`message ${i}`);
      }
    }
    // Each message is still remembered when the next pass comes round to it, so the passes after the first are silent
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
    // it instead would cost a slot in every generation, capping how large a working set the test above can dedupe
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LOG_ONCE_MAX_MESSAGES * 2 + 2);
  });
  it('logs a message again after resetLogOnce()', () => {
    logOnce('a message');
    logOnce('a message');
    resetLogOnce();
    logOnce('a message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });
  describe('with a warning ID', () => {
    it('logs by default, ending the message with the ID', () => {
      logOnce('a message.', 'warn', undefined, 'form-data-ignored');
      logOnce('a message.', 'warn', undefined, 'form-data-ignored');
      expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a message. [form-data-ignored]');
    });
    it('throws an RJSFWarningError, on every repeat, for an ID selected by its category', () => {
      setWarningOptions({ throwOn: ['migration'] });
      const cause = new Error('boom');
      const thrown = expect.objectContaining({
        name: 'RJSFWarningError',
        message: 'a message: [form-data-ignored]',
        id: 'form-data-ignored',
        cause,
      });
      expect(() => logOnce('a message:', 'error', cause, 'form-data-ignored')).toThrow(RJSFWarningError);
      expect(() => logOnce('a message:', 'error', cause, 'form-data-ignored')).toThrow(thrown);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
    it('throws for an ID selected by itself, and logs one not selected', () => {
      setWarningOptions({ throwOn: ['ui-widget-element'] });
      expect(() => logOnce('a message', 'error', undefined, 'ui-widget-element')).toThrow(RJSFWarningError);
      logOnce('another message', 'error', undefined, 'ui-widget-options-object');
      logOnce('a third message', 'warn', undefined, 'form-data-ignored');
      expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith('another message [ui-widget-options-object]');
      expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a third message [form-data-ignored]');
    });
    it('logs an excepted ID, deduped, even where throwOn selects it', () => {
      setWarningOptions({ throwOn: ['migration'], except: ['antd-span-twelfths'] });
      logOnce('a message', 'warn', undefined, 'antd-span-twelfths');
      logOnce('a message', 'warn', undefined, 'antd-span-twelfths');
      expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a message [antd-span-twelfths]');
    });
    it('never throws for a warning without an ID', () => {
      setWarningOptions({ throwOn: ['migration', 'config'] });
      logOnce('a message');
      expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a message');
    });
    it('applies a changed setting to the next call, even for a message already logged', () => {
      logOnce('a message', 'warn', undefined, 'form-data-both-seeds');
      setWarningOptions({ throwOn: ['form-data-both-seeds'] });
      expect(() => logOnce('a message', 'warn', undefined, 'form-data-both-seeds')).toThrow(RJSFWarningError);
      setWarningOptions({});
      logOnce('a message', 'warn', undefined, 'form-data-both-seeds');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
    it('keeps its own copy of the options, so changing them afterwards changes nothing', () => {
      const throwOn: ('migration' | 'config')[] = [];
      setWarningOptions({ throwOn });
      throwOn.push('migration');
      logOnce('a message', 'warn', undefined, 'form-data-ignored');
      expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a message [form-data-ignored]');
    });
    it('restores the default when called with no options', () => {
      setWarningOptions({ throwOn: ['migration'] });
      setWarningOptions();
      logOnce('a message', 'warn', undefined, 'form-data-ignored');
      expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('a message [form-data-ignored]');
    });
    it('keeps the setting across resetLogOnce()', () => {
      setWarningOptions({ throwOn: ['config'] });
      resetLogOnce();
      expect(() => logOnce('a message', 'error', undefined, 'ui-widget-element')).toThrow(RJSFWarningError);
    });
  });
});
