import type { RJSFSchema } from '@rjsf/utils';
import { ID_KEY, schemaKey, schemaParser } from '@rjsf/utils';

import precompiledCoverageTests from '../../utils/test/testUtils/precompiledCoverageTests.ts';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import createAjvInstance from '../src/createAjvInstance.ts';
import { createPrecompiledValidator } from '../src/index.ts';
import qualifyRootRefs from '../src/qualifyRootRefs.ts';
import { SUPER_SCHEMA_OPTIONS, evalValidatorCode, superSchema } from './harness/compileSuperSchema.ts';
import { CUSTOM_OPTIONS, expectWarn } from './harness/testData.ts';

vi.mock('../src/createAjvInstance', async (importOriginal) => {
  const { default: realCreateAjvInstance } = await importOriginal<{
    default: typeof createAjvInstance;
  }>();
  return { default: vi.fn((...args: any[]) => realCreateAjvInstance(...args)) };
});

/** The parsed schemas as they are compiled: every one but the root names the root in its local `$ref`s */
function compiledSchemas(rootSchema: RJSFSchema): RJSFSchema[] {
  const rootId = schemaKey(rootSchema);
  return Object.values(schemaParser(rootSchema)).map((parsed) =>
    parsed[ID_KEY] === rootId ? parsed : qualifyRootRefs(parsed, rootId),
  );
}

describe('compileSchemaValidatorsCode()', () => {
  describe('compiling without additional options', () => {
    let schemas: RJSFSchema[];
    beforeAll(() => {
      schemas = compiledSchemas(superSchema);
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
      schemas = compiledSchemas(superSchema);
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
  precompiledCoverageTests((rootSchema, options) =>
    createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, options)),
      rootSchema,
      options,
    ),
  );
});
