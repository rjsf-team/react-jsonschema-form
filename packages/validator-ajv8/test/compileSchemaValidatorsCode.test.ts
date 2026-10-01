import type { RJSFSchema } from '@rjsf/utils';
import { getDefaultFormState, retrieveSchema, schemaParser } from '@rjsf/utils';

import {
  MERGED_PATTERN_PROPERTY_FORM_DATA,
  SCHEMA_MERGED_FOR_PATTERN_PROPERTY,
  titleChoiceMergeAllOf as customMergeAllOf,
} from '../../utils/test/testUtils/customMergeAllOfData.ts';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
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

describe('compileSchemaValidatorsCode() with a customMergeAllOf', () => {
  const rootSchema = SCHEMA_MERGED_FOR_PATTERN_PROPERTY;
  const formData = MERGED_PATTERN_PROPERTY_FORM_DATA;

  it('misses the custom-merged sub-schemas when compiled without it', () => {
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema)),
      rootSchema,
    );
    expect(() =>
      getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData }),
    ).toThrow('No precompiled validator function was found for the given schema');
  });
  it('covers the custom-merged sub-schemas when compiled with it', () => {
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, {}, { customMergeAllOf })),
      rootSchema,
    );
    expect(getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData })).toEqual(
      formData,
    );
  });
  it.each([
    ['on submit, against the root schema', false],
    ['under live validation, against the root schema the form resolved', true],
  ])('validates %s with a customValidate when compiled with it', (_when, resolveRoot) => {
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, {}, { customMergeAllOf })),
      rootSchema,
      { customMergeAllOf },
    );
    const context = { validator, customMergeAllOf };
    const invalidFormData = { p: { choice: 'b', x: 5 } };
    const schema = resolveRoot ? retrieveSchema(context, rootSchema, rootSchema, invalidFormData) : rootSchema;
    // A `customValidate` makes the validator compute the form's defaults, which validate the custom-merged `oneOf`
    const customValidate = vi.fn((_formData, errors) => errors);

    const { errors } = validator.validateFormData(invalidFormData, schema, customValidate);

    expect(errors.map((e) => e.property)).toEqual(['.p.x']);
    expect(customValidate).toHaveBeenCalledWith(invalidFormData, expect.anything(), undefined, expect.anything());
  });
});
