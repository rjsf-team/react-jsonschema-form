import noop from 'lodash';
import type { MockInstance } from 'vitest';

import logUnsupportedDefaultForEnum from '../src/logUnsupportedDefaultForEnum';

describe('logUnsupportedDefaultForEnum()', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    // oxlint-disable-next-line no-empty-function
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
