import type { RJSFSchema } from '@rjsf/utils';
import { schemaKey, getValidationSchemas } from '@rjsf/utils';
import { Ajv2020 } from 'ajv/dist/2020.js';
import uri from 'ajv/dist/runtime/uri.js';

import nestedResourceTests, { mergedResourceViewTests } from '../../utils/test/testUtils/nestedResourceTests.ts';
import pointerValidationTests, {
  sharedObjectValidationTests,
  sharedSubschemaValidationTests,
} from '../../utils/test/testUtils/pointerValidationTests.ts';
import precompiledCoverageTests from '../../utils/test/testUtils/precompiledCoverageTests.ts';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import { compiledSchemas as compiled } from '../src/compileSchemaValidatorsCode.ts';
import createAjvInstance from '../src/createAjvInstance.ts';
import { createPrecompiledValidator } from '../src/index.ts';
import { SUPER_SCHEMA_OPTIONS, evalValidatorCode, superSchema } from './harness/compileSuperSchema.ts';
import { CUSTOM_OPTIONS, expectWarn } from './harness/testData.ts';

vi.mock('../src/createAjvInstance', async (importOriginal) => {
  const { default: realCreateAjvInstance } = await importOriginal<{
    default: typeof createAjvInstance;
  }>();
  return { default: vi.fn((...args: any[]) => realCreateAjvInstance(...args)) };
});

/** The parsed schemas as they are compiled */
function compiledSchemas(rootSchema: RJSFSchema): Record<string, RJSFSchema> {
  return compiled(getValidationSchemas(rootSchema), schemaKey(rootSchema), uri.default).schemas;
}

describe('compileSchemaValidatorsCode()', () => {
  describe('compiling without additional options', () => {
    let schemas: Record<string, RJSFSchema>;
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
    let schemas: Record<string, RJSFSchema>;
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
  it('compiles the options of a root whose $id ends in an empty fragment, their local $refs naming the root', () => {
    const rootSchema: RJSFSchema = {
      $id: 'http://x.example/root.json#',
      definitions: { str: { type: 'string' }, num: { type: 'number' } },
      type: 'object',
      properties: {
        v: {
          oneOf: [
            { type: 'object', properties: { k: { $ref: '#/definitions/str' } }, required: ['k'] },
            { type: 'object', properties: { k: { $ref: '#/definitions/num' } }, required: ['k'] },
          ],
        },
      },
    };
    const validateFns = evalValidatorCode(compileSchemaValidatorsCode(rootSchema));
    const validateRoot = validateFns[schemaKey(rootSchema)];
    expect(validateRoot({ v: { k: 3 } })).toBe(true);
    expect(validateRoot({ v: { k: true } })).toBe(false);
  });
  precompiledCoverageTests((rootSchema, options) =>
    createPrecompiledValidator(evalValidatorCode(compileSchemaValidatorsCode(rootSchema)), rootSchema, options),
  );
  pointerValidationTests((rootSchema) =>
    createPrecompiledValidator(evalValidatorCode(compileSchemaValidatorsCode(rootSchema)), rootSchema),
  );
  sharedObjectValidationTests((compiledFrom, runWith) =>
    createPrecompiledValidator(evalValidatorCode(compileSchemaValidatorsCode(compiledFrom)), runWith),
  );
  sharedSubschemaValidationTests((compiledFrom, runWith) =>
    createPrecompiledValidator(evalValidatorCode(compileSchemaValidatorsCode(compiledFrom)), runWith),
  );
  const precompiledFor = (rootSchema: RJSFSchema) => {
    const options = String(rootSchema.$schema).includes('2020-12') ? { AjvClass: Ajv2020 } : {};
    return createPrecompiledValidator(evalValidatorCode(compileSchemaValidatorsCode(rootSchema, options)), rootSchema);
  };
  nestedResourceTests(precompiledFor);
  mergedResourceViewTests(precompiledFor, false);
});
