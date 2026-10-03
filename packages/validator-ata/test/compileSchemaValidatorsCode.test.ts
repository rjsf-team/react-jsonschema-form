import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils, getDefaultFormState, omitExtraData, retrieveSchema } from '@rjsf/utils';

import {
  MERGED_PATTERN_KEY_FORM_DATA,
  MERGED_PATTERN_PROPERTY_FORM_DATA,
  SCHEMA_MERGED_FOR_PATTERN_KEY,
  SCHEMA_MERGED_FOR_PATTERN_PROPERTY,
  titleChoiceMergeAllOf as customMergeAllOf,
} from '../../utils/test/testUtils/customMergeAllOfData.ts';
import {
  identityMergeAllOf,
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
import { createPrecompiledValidator } from '../src/index.ts';

// Evaluate generated CJS module source into an exports object.
function loadModule(code: string) {
  const module = { exports: {} as Record<string, any> };
  // oxlint-disable-next-line no-new-func, no-implied-eval
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

const schema: RJSFSchema = {
  $id: 'root',
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: { $ref: '#/definitions/address' },
  },
  required: ['name'],
  definitions: {
    address: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
  },
};

describe('compileSchemaValidatorsCode', () => {
  test('generates a module with a validator function per schema id', () => {
    const code = compileSchemaValidatorsCode(schema);
    const validateFns = loadModule(code);
    const validator = createPrecompiledValidator(validateFns, schema);

    expect(validator.isValid(schema, { name: 'Mert' }, schema)).toBe(true);
    expect(validator.isValid(schema, { name: 5 }, schema)).toBe(false);
  });

  test('resolves cross-schema $ref in the compiled output', () => {
    const code = compileSchemaValidatorsCode(schema);
    const validateFns = loadModule(code);
    const validator = createPrecompiledValidator(validateFns, schema);

    const good = validator.validateFormData({ name: 'Mert', address: { city: 'Istanbul' } }, schema);
    expect(good.errors).toHaveLength(0);
    const bad = validator.validateFormData({ name: 'Mert', address: {} }, schema);
    expect(bad.errors.length).toBeGreaterThan(0);
  });

  test('reports a clear error for a schema ata cannot compile to standalone', () => {
    // ata returns null for a $defs entry that carries its own $id, so a validator
    // in the bundle can be absent. The wrapper must surface that rather than crash
    // with "x is not a function".
    const idDefSchema: RJSFSchema = {
      $id: 'rootWithIdDef',
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: { $ref: '#/definitions/address' },
      },
      required: ['name'],
      definitions: {
        address: { $id: 'addressDef', type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
      },
    };
    const validateFns = loadModule(compileSchemaValidatorsCode(idDefSchema));
    Object.keys(validateFns).forEach((key) => {
      try {
        validateFns[key]({});
      } catch (err) {
        expect((err as Error).message).toContain('was not compiled to a standalone validator');
        expect((err as Error).message).not.toMatch(/is not a function/);
      }
    });
  });

  test('embeds RegExp and string custom formats into the compiled output', () => {
    const fmtSchema: RJSFSchema = {
      $id: 'fmt',
      type: 'object',
      properties: {
        code: { type: 'string', format: 'upperHex' },
        tag: { type: 'string', format: 'lowerTag' },
      },
      required: ['code', 'tag'],
    };
    const code = compileSchemaValidatorsCode(fmtSchema, {
      customFormats: { upperHex: /^[0-9A-F]+$/, lowerTag: '^[a-z]+$' },
    });
    const validator = createPrecompiledValidator(loadModule(code), fmtSchema);

    expect(validator.isValid(fmtSchema, { code: 'AB12', tag: 'blue' }, fmtSchema)).toBe(true);
    expect(validator.isValid(fmtSchema, { code: 'xy', tag: 'blue' }, fmtSchema)).toBe(false);
    expect(validator.isValid(fmtSchema, { code: 'AB12', tag: 'Blue' }, fmtSchema)).toBe(false);
  });

  test('rejects a function custom format, which cannot be serialized into a bundle', () => {
    const fmtSchema: RJSFSchema = {
      $id: 'fmtFn',
      type: 'object',
      properties: { even: { type: 'string', format: 'evenLength' } },
    };
    expect(() =>
      compileSchemaValidatorsCode(fmtSchema, {
        customFormats: { evenLength: (value: string) => value.length % 2 === 0 },
      }),
    ).toThrow(/custom format "evenLength" is a function/);
  });

  test('reports per-field errors for schema-valued additionalProperties', () => {
    // ata-validator >= 0.17.4 emits a per-property error for schema-valued
    // additionalProperties in the compiled output, matching the runtime validator,
    // so form fields for additional properties get their own error.
    const apSchema: RJSFSchema = {
      $id: 'apRoot',
      type: 'object',
      properties: { a: { type: 'string' } },
      additionalProperties: { type: 'number' },
    };
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(apSchema)), apSchema);
    const { errors } = validator.validateFormData({ a: 'x', bad: 'notnum', also: 'nope' }, apSchema);
    expect(errors.map((e) => e.property).sort()).toEqual(['.also', '.bad']);
  });

  describe('with a customMergeAllOf', () => {
    const rootSchema = SCHEMA_MERGED_FOR_PATTERN_PROPERTY;
    const formData = MERGED_PATTERN_PROPERTY_FORM_DATA;

    test('misses the custom-merged sub-schemas when compiled without it', () => {
      const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
      expect(() =>
        getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData }),
      ).toThrow('No precompiled validator function was found for the given schema');
    });
    test('covers the custom-merged sub-schemas when compiled with it', () => {
      const validator = createPrecompiledValidator(
        loadModule(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf })),
        rootSchema,
      );
      expect(
        getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData }),
      ).toEqual(formData);
    });
    describe('for a key only patternProperties match', () => {
      const patternKeySchema = SCHEMA_MERGED_FOR_PATTERN_KEY;
      const patternKeyFormData = MERGED_PATTERN_KEY_FORM_DATA;

      test('covers the sub-schemas of the merge the form makes for that key', () => {
        const validator = createPrecompiledValidator(
          loadModule(compileSchemaValidatorsCode(patternKeySchema, { customMergeAllOf })),
          patternKeySchema,
        );
        expect(
          getDefaultFormState(
            { validator, customMergeAllOf },
            { schema: patternKeySchema, rootSchema: patternKeySchema, formData: patternKeyFormData },
          ),
        ).toEqual(patternKeyFormData);
      });
    });
    test.each([
      ['on submit, against the root schema', false],
      ['under live validation, against the root schema the form resolved', true],
    ])('validates %s with a customValidate when compiled with it', (_when, resolveRoot) => {
      const validator = createPrecompiledValidator(
        loadModule(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf })),
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
});

describe('compileSchemaValidatorsCode() for the sub-schemas a form validates against unmerged', () => {
  it('covers a nested allOf unmerged, as getObjectDefaults() reads it', () => {
    const rootSchema = SCHEMA_NESTED_ALL_OF;
    const validator = createPrecompiledValidator(
      loadModule(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf })),
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
      loadModule(compileSchemaValidatorsCode(rootSchema, { customMergeAllOf: identityMergeAllOf })),
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
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    const schemaUtils = createSchemaUtils({ validator }, rootSchema);
    const formData = { meow: 'x' };
    const options = (rootSchema.properties!.pet as RJSFSchema).oneOf as RJSFSchema[];
    const retrieved = options.map((option) => schemaUtils.retrieveSchema(option, formData));

    expect(schemaUtils.getClosestMatchingOption(formData, retrieved, 0)).toBe(0);
  });
  it('covers the merge of two patternProperties that match the same key', () => {
    const rootSchema = SCHEMA_TWO_MATCHING_PATTERNS;
    const validator = createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(rootSchema)), rootSchema);
    expect(
      getDefaultFormState({ validator }, { schema: rootSchema, rootSchema, formData: TWO_MATCHING_PATTERNS_FORM_DATA }),
    ).toEqual(TWO_MATCHING_PATTERNS_FORM_DATA);
  });
});
