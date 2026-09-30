import validator from '@rjsf/validator-ajv8';
import type { MockInstance } from 'vitest';

import { loadedState, readSharedSetup } from '../../src/components/Playground.tsx';
import type { ThemesType } from '../../src/components/ThemeSelector.tsx';
import base64 from '../../src/utils/base64.ts';

const themes: Record<string, ThemesType> = {
  default: { theme: {}, stylesheet: 'default.css' },
  mui: { theme: {}, stylesheet: 'mui.css' },
};
const validators = { AJV8: validator };
const schema = { type: 'object' as const, properties: { name: { type: 'string' as const, default: 'Ada' } } };

function load(data: Record<string, unknown>) {
  return loadedState({ schema, liveSettings: {}, ...data }, 'default', themes, validators);
}

describe('readSharedSetup', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined without alerting for an empty hash', () => {
    expect(readSharedSetup('')).toBeUndefined();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('decodes an object', () => {
    expect(readSharedSetup(base64.encode(JSON.stringify({ theme: 'mui' })))).toEqual({ theme: 'mui' });
  });

  it.each([['"x"'], ['1'], ['null'], ['[]']])('rejects a hash decoding to %s', (json) => {
    expect(readSharedSetup(base64.encode(json))).toBeUndefined();
    expect(window.alert).toHaveBeenCalledWith('Unable to load form setup data.');
  });

  it('rejects a hash that is not JSON', () => {
    expect(readSharedSetup(base64.encode('{'))).toBeUndefined();
    expect(window.alert).toHaveBeenCalledWith('Unable to load form setup data.');
  });
});

describe('loadedState', () => {
  let consoleError: MockInstance;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps a theme the playground has', () => {
    expect(load({ theme: 'mui' })).toMatchObject({ theme: 'mui', stylesheet: 'mui.css' });
  });

  it('maps `material-ui-5` to `mui`', () => {
    expect(load({ theme: 'material-ui-5' }).theme).toBe('mui');
  });

  it.each([['semantic-ui'], ['constructor'], ['toString'], ['__proto__']])(
    'falls back to the default theme for %s',
    (theme) => {
      expect(load({ theme })).toMatchObject({ theme: 'default', stylesheet: 'default.css' });
    },
  );

  it.each([['Removed sample'], ['constructor']])('ignores a sample named %s', (sampleName) => {
    expect(load({ sampleName })).toMatchObject({ sampleName, uiSchemaGenerator: undefined });
  });

  it('falls back to the default validator for one the playground lacks, and still seeds defaults', () => {
    expect(load({ validator: 'removed' })).toMatchObject({ validator: 'AJV8', formData: { name: 'Ada' } });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('leaves the validator to the caller when the data names none', () => {
    expect(load({}).validator).toBeUndefined();
  });
});
