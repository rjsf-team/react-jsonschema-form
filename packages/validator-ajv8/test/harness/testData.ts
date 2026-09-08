import { noop } from '@rjsf/utils';
import type Ajv from 'ajv';

import type { CustomValidatorOptionsType } from '../../src/index.ts';

/** Runs `fn` with console.warn stubbed, asserts it warned with `expectedWarning`, and returns the result. */
export function expectWarn<T>(fn: () => T, ...expectedWarning: unknown[]): T {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
  try {
    const result = fn();
    expect(warnSpy).toHaveBeenCalledWith(...expectedWarning);
    return result;
  } finally {
    warnSpy.mockRestore();
  }
}

export const CUSTOM_OPTIONS: CustomValidatorOptionsType = {
  // oxlint-disable-next-line typescript/no-var-requires
  additionalMetaSchemas: [require('ajv/lib/refs/json-schema-draft-06.json')],
  customFormats: {
    'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
    'area-code': /\d{3}/,
  },
  ajvOptionsOverrides: {
    $data: true,
    verbose: true,
  },
  ajvFormatOptions: {
    mode: 'fast',
  },
  extenderFn: (ajv: Ajv) => ajv,
};
