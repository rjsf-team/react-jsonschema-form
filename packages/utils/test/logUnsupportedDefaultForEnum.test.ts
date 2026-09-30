import type { MockInstance } from 'vitest';

import { noop } from '../src/index.ts';
import type { RJSFSchema } from '../src/index.ts';
import logUnsupportedDefaultForEnum from '../src/logUnsupportedDefaultForEnum.ts';

describe('logUnsupportedDefaultForEnum()', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('logs when a single-select schema default is not in enum options', () => {
    logUnsupportedDefaultForEnum('root_color', { type: 'string', default: 'blue' }, [{ label: 'Red', value: 'red' }]);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'The schema default value "blue" is not one of the values in the enum options for "root_color"',
    );
  });

  it('logs, without throwing, a default JSON.stringify() cannot convert', () => {
    const circular: unknown[] = [];
    circular.push(circular);
    const unprintable = Object.create(null) as Record<string, unknown>;
    unprintable.self = unprintable;
    const options = [{ label: 'Red', value: 'red' }];
    // A schema built in JS can hold a default no JSON schema could
    const jsBuilt = (value: unknown) => ({ default: value }) as RJSFSchema;

    expect(() => {
      logUnsupportedDefaultForEnum('root_big', jsBuilt([10n]), options);
      logUnsupportedDefaultForEnum('root_circular', jsBuilt(circular), options);
      logUnsupportedDefaultForEnum('root_unprintable', jsBuilt(unprintable), options);
    }).not.toThrow();
    expect(consoleErrorSpy.mock.calls).toEqual([
      ['The schema default value "["10"]" is not one of the values in the enum options for "root_big"'],
      ['The schema default value "" is not one of the values in the enum options for "root_circular"'],
      ['The schema default value "object" is not one of the values in the enum options for "root_unprintable"'],
    ]);
  });

  it('does not log when a single-select schema default is in enum options', () => {
    logUnsupportedDefaultForEnum('root_color', { type: 'string', default: 'red' }, [{ label: 'Red', value: 'red' }]);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('does not log for multiple-select widgets', () => {
    logUnsupportedDefaultForEnum(
      'root_color',
      { type: 'array', default: ['blue'] },
      [{ label: 'Red', value: 'red' }],
      true,
    );

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
