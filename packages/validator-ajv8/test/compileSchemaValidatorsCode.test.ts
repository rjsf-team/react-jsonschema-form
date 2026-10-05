import type { CustomValidator, RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils, getDefaultFormState, omitExtraData, retrieveSchema, schemaParser } from '@rjsf/utils';

import {
  MERGED_PATTERN_KEY_FORM_DATA,
  MERGED_PATTERN_PROPERTY_FORM_DATA,
  SCHEMA_MERGED_FOR_PATTERN_KEY,
  SCHEMA_MERGED_FOR_PATTERN_PROPERTY,
  titleChoiceMergeAllOf as customMergeAllOf,
} from '../../utils/test/testUtils/customMergeAllOfData.ts';
import {
  CONDITIONAL_UNMERGED_ALL_OF_FORM_DATA,
  CONDITIONAL_UNMERGED_ALL_OF_OMITTED,
  DEPENDENCY_ONE_OF_FORM_DATA,
  DEPENDENCY_ONE_OF_OMITTED,
  identityMergeAllOf,
  ONE_OF_ALL_OF_REF_OPTIONS,
  SCHEMA_CONDITIONAL_UNMERGED_ALL_OF,
  SCHEMA_DEPENDENCY_ONE_OF,
  NESTED_ALL_OF_FORM_DATA,
  SCHEMA_NESTED_ALL_OF,
  SCHEMA_ONE_OF_ALL_OF_REF,
  SCHEMA_TWO_MATCHING_PATTERNS,
  SCHEMA_UNMERGED_ALL_OF,
  TWO_MATCHING_PATTERNS_FORM_DATA,
  UNMERGED_ALL_OF_FORM_DATA,
  UNMERGED_ALL_OF_OMITTED,
} from '../../utils/test/testUtils/parsedSchemaData.ts';
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
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf })),
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
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf })),
      rootSchema,
      { customMergeAllOf },
    );
    const context = { validator, customMergeAllOf };
    const invalidFormData = { p: { choice: 'b', x: 5 } };
    const schema = resolveRoot ? retrieveSchema(context, rootSchema, rootSchema, invalidFormData) : rootSchema;
    // A `customValidate` makes the validator compute the form's defaults, which validate the custom-merged `oneOf`
    const customValidate = vi.fn<CustomValidator>((_formData, errors) => errors);

    const { errors } = validator.validateFormData(invalidFormData, schema, customValidate);

    expect(errors.map((e) => e.property)).toEqual(['.p.x']);
    expect(customValidate).toHaveBeenCalledWith(invalidFormData, expect.anything(), undefined, expect.anything());
  });
});

describe('compileSchemaValidatorsCode() with a customMergeAllOf, for a key only patternProperties match', () => {
  const rootSchema = SCHEMA_MERGED_FOR_PATTERN_KEY;
  const formData = MERGED_PATTERN_KEY_FORM_DATA;

  it('covers the sub-schemas of the merge the form makes for that key', () => {
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf })),
      rootSchema,
    );
    expect(getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData })).toEqual(
      formData,
    );
  });
});

describe('compileSchemaValidatorsCode() for the sub-schemas a form validates against unmerged', () => {
  it('covers a nested allOf unmerged, as getObjectDefaults() reads it', () => {
    const rootSchema = SCHEMA_NESTED_ALL_OF;
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf })),
      rootSchema,
      { customMergeAllOf },
    );
    expect(
      getDefaultFormState(
        { validator, customMergeAllOf },
        { schema: rootSchema, rootSchema, formData: NESTED_ALL_OF_FORM_DATA },
      ),
    ).toEqual(NESTED_ALL_OF_FORM_DATA);
  });
  it('covers the entries a merge leaves in the allOf, as omitExtraData() reads them', () => {
    const rootSchema = SCHEMA_UNMERGED_ALL_OF;
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf: identityMergeAllOf })),
      rootSchema,
      { customMergeAllOf: identityMergeAllOf },
    );
    expect(
      omitExtraData(
        { validator, customMergeAllOf: identityMergeAllOf },
        rootSchema,
        rootSchema,
        UNMERGED_ALL_OF_FORM_DATA,
      ),
    ).toEqual(UNMERGED_ALL_OF_OMITTED);
  });
  it('covers an option retrieved from a $ref to an allOf, as MultiSchemaField scores it', () => {
    const rootSchema = SCHEMA_ONE_OF_ALL_OF_REF;
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema)),
      rootSchema,
    );
    const schemaUtils = createSchemaUtils({ validator }, rootSchema);
    const formData = { meow: 'x' };
    const retrieved = ONE_OF_ALL_OF_REF_OPTIONS.map((option) => schemaUtils.retrieveSchema(option, formData));

    expect(schemaUtils.getClosestMatchingOption(formData, retrieved, 0)).toBe(0);
  });
  it('covers the entries of an allOf only reached through a condition', () => {
    const rootSchema = SCHEMA_CONDITIONAL_UNMERGED_ALL_OF;
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf: identityMergeAllOf })),
      rootSchema,
      { customMergeAllOf: identityMergeAllOf },
    );
    expect(
      omitExtraData(
        { validator, customMergeAllOf: identityMergeAllOf },
        rootSchema,
        rootSchema,
        CONDITIONAL_UNMERGED_ALL_OF_FORM_DATA,
      ),
    ).toEqual(CONDITIONAL_UNMERGED_ALL_OF_OMITTED);
  });
  it("covers the options of a dependency's oneOf, as omitExtraData() scores them", () => {
    const rootSchema = SCHEMA_DEPENDENCY_ONE_OF;
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema)),
      rootSchema,
    );
    expect(omitExtraData({ validator }, rootSchema, rootSchema, DEPENDENCY_ONE_OF_FORM_DATA)).toEqual(
      DEPENDENCY_ONE_OF_OMITTED,
    );
  });
  it('covers the merge of two patternProperties that match the same key', () => {
    const rootSchema = SCHEMA_TWO_MATCHING_PATTERNS;
    const validator = createPrecompiledValidator(
      evalValidatorCode(compileSchemaValidatorsCode(rootSchema)),
      rootSchema,
    );
    expect(
      getDefaultFormState({ validator }, { schema: rootSchema, rootSchema, formData: TWO_MATCHING_PATTERNS_FORM_DATA }),
    ).toEqual(TWO_MATCHING_PATTERNS_FORM_DATA);
  });
});
