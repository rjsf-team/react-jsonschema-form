import type { RJSFSchema } from '@rjsf/utils';
import { schemaParser } from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import createAjvInstance from '../src/createAjvInstance.ts';
import { SUPER_SCHEMA_OPTIONS, superSchema } from './harness/compileSuperSchema.ts';
import { CUSTOM_OPTIONS, expectWarn } from './harness/testData.ts';

vi.mock('../src/createAjvInstance', async (importOriginal) => {
  const { default: realCreateAjvInstance } = await importOriginal<{
    default: typeof createAjvInstance;
  }>();
  return { default: vi.fn((...args: any[]) => realCreateAjvInstance(...args)) };
});

describe('compileSchemaValidatorsCode()', () => {
  describe('compiling without additional options', () => {
    let schemas: RJSFSchema[];
    beforeAll(() => {
      schemas = Object.values(schemaParser(superSchema));
      // superSchema deliberately uses the unregistered "phone-us" format, which AJV warns about
      expectWarn(() => compileSchemaValidatorsCode(superSchema), expect.stringContaining('unknown format'));
    });
    it('create AJV instance was called with the expected options', () => {
      const expectedCompileOpts = {
        code: { source: true, lines: true },
        schemas,
      };
      expect(createAjvInstance).toHaveBeenCalledWith(
        undefined,
        undefined,
        expectedCompileOpts,
        undefined,
        undefined,
        undefined,
      );
    });
  });
  describe('compiling WITH additional options', () => {
    let schemas: RJSFSchema[];
    beforeAll(() => {
      schemas = Object.values(schemaParser(superSchema));
      compileSchemaValidatorsCode(superSchema, SUPER_SCHEMA_OPTIONS);
    });
    it('create AJV instance was called with the expected options', () => {
      const {
        additionalMetaSchemas,
        customFormats,
        ajvOptionsOverrides = {},
        ajvFormatOptions,
        AjvClass,
        extenderFn,
      } = CUSTOM_OPTIONS;
      const expectedCompileOpts = {
        ...ajvOptionsOverrides,
        code: { source: true, lines: false },
        schemas,
      };
      expect(createAjvInstance).toHaveBeenCalledWith(
        additionalMetaSchemas,
        customFormats,
        expectedCompileOpts,
        ajvFormatOptions,
        AjvClass,
        extenderFn,
      );
    });
  });
});
