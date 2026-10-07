import type { CustomValidator, RJSFSchema, SchemaParserOptions, ValidatorType } from '../../src/index.ts';
import { createSchemaUtils, getDefaultFormState, omitExtraData, retrieveSchema } from '../../src/index.ts';
import {
  MERGED_PATTERN_KEY_FORM_DATA,
  MERGED_PATTERN_PROPERTY_FORM_DATA,
  SCHEMA_MERGED_FOR_PATTERN_KEY,
  SCHEMA_MERGED_FOR_PATTERN_PROPERTY,
  titleChoiceMergeAllOf as customMergeAllOf,
} from './customMergeAllOfData.ts';
import {
  CONDITIONAL_UNMERGED_ALL_OF_FORM_DATA,
  CONDITIONAL_UNMERGED_ALL_OF_OMITTED,
  DEPENDENCY_ONE_OF_FORM_DATA,
  DEPENDENCY_ONE_OF_OMITTED,
  identityMergeAllOf,
  NESTED_ALL_OF_FORM_DATA,
  ONE_OF_ALL_OF_REF_OPTIONS,
  SCHEMA_CONDITIONAL_UNMERGED_ALL_OF,
  SCHEMA_DEPENDENCY_ONE_OF,
  SCHEMA_NESTED_ALL_OF,
  SCHEMA_ONE_OF_ALL_OF_REF,
  SCHEMA_TWO_MATCHING_PATTERNS,
  SCHEMA_UNMERGED_ALL_OF,
  TWO_MATCHING_PATTERNS_FORM_DATA,
  UNMERGED_ALL_OF_FORM_DATA,
  UNMERGED_ALL_OF_OMITTED,
} from './parsedSchemaData.ts';

/** Compiles the `rootSchema` and returns a precompiled validator built from the result. Each validator package
 * supplies its own, since they differ only in how the compiled code is loaded.
 *
 * @param rootSchema - The schema to compile the validator functions from
 * @param [options] - The options to compile with, which the precompiled validator is also built with
 * @returns - The precompiled validator for the `rootSchema`
 */
export type BuildPrecompiledValidator = (rootSchema: RJSFSchema, options?: SchemaParserOptions) => ValidatorType;

/** Runs the suite covering the sub-schemas a form validates against that are not the ones a plain walk of the schema
 * would reach -- the entries a merge leaves in an `allOf`, the options a `customMergeAllOf` rewrites, and the merges a
 * form makes for a `patternProperties` key. A precompiled validator can only answer what the parse compiled, so each
 * case fails with `No precompiled validator function was found` when the parse misses it.
 *
 * Both precompiled validator packages have to cover all of it, and they differ only in how they load the compiled
 * code, so the cases live here and each package passes its own `buildValidator`.
 *
 * @param buildValidator - Compiles a schema and returns the package's precompiled validator for it
 */
export default function precompiledCoverageTests(buildValidator: BuildPrecompiledValidator) {
  describe('with a customMergeAllOf', () => {
    const rootSchema = SCHEMA_MERGED_FOR_PATTERN_PROPERTY;
    const formData = MERGED_PATTERN_PROPERTY_FORM_DATA;

    it('misses the custom-merged sub-schemas when compiled without it', () => {
      const validator = buildValidator(rootSchema);
      expect(() =>
        getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData }),
      ).toThrow('No precompiled validator function was found for the given schema');
    });
    it('covers the custom-merged sub-schemas when compiled with it', () => {
      const validator = buildValidator(rootSchema, { customMergeAllOf });
      expect(
        getDefaultFormState({ validator, customMergeAllOf }, { schema: rootSchema, rootSchema, formData }),
      ).toEqual(formData);
    });
    it('covers the sub-schemas of the merge the form makes for a key only patternProperties match', () => {
      const patternKeySchema = SCHEMA_MERGED_FOR_PATTERN_KEY;
      const validator = buildValidator(patternKeySchema, { customMergeAllOf });
      expect(
        getDefaultFormState(
          { validator, customMergeAllOf },
          { schema: patternKeySchema, rootSchema: patternKeySchema, formData: MERGED_PATTERN_KEY_FORM_DATA },
        ),
      ).toEqual(MERGED_PATTERN_KEY_FORM_DATA);
    });
    it.each([
      ['on submit, against the root schema', false],
      ['under live validation, against the root schema the form resolved', true],
    ])('validates %s with a customValidate when compiled with it', (_when, resolveRoot) => {
      const validator = buildValidator(rootSchema, { customMergeAllOf });
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

  describe('for the sub-schemas a form validates against unmerged', () => {
    it('covers a nested allOf unmerged, as getObjectDefaults() reads it', () => {
      const rootSchema = SCHEMA_NESTED_ALL_OF;
      const validator = buildValidator(rootSchema, { customMergeAllOf });
      expect(
        getDefaultFormState(
          { validator, customMergeAllOf },
          { schema: rootSchema, rootSchema, formData: NESTED_ALL_OF_FORM_DATA },
        ),
      ).toEqual(NESTED_ALL_OF_FORM_DATA);
    });
    it('covers the entries a merge leaves in the allOf, as omitExtraData() reads them', () => {
      const rootSchema = SCHEMA_UNMERGED_ALL_OF;
      const validator = buildValidator(rootSchema, { customMergeAllOf: identityMergeAllOf });
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
      const validator = buildValidator(rootSchema);
      const schemaUtils = createSchemaUtils({ validator }, rootSchema);
      const formData = { meow: 'x' };
      const retrieved = ONE_OF_ALL_OF_REF_OPTIONS.map((option) => schemaUtils.retrieveSchema(option, formData));

      expect(schemaUtils.getClosestMatchingOption(formData, retrieved, 0)).toBe(0);
    });
    it('covers the entries of an allOf only reached through a condition', () => {
      const rootSchema = SCHEMA_CONDITIONAL_UNMERGED_ALL_OF;
      const validator = buildValidator(rootSchema, { customMergeAllOf: identityMergeAllOf });
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
      const validator = buildValidator(rootSchema);
      expect(omitExtraData({ validator }, rootSchema, rootSchema, DEPENDENCY_ONE_OF_FORM_DATA)).toEqual(
        DEPENDENCY_ONE_OF_OMITTED,
      );
    });
    it('covers the merge of two patternProperties that match the same key', () => {
      const rootSchema = SCHEMA_TWO_MATCHING_PATTERNS;
      const validator = buildValidator(rootSchema);
      expect(
        getDefaultFormState(
          { validator },
          { schema: rootSchema, rootSchema, formData: TWO_MATCHING_PATTERNS_FORM_DATA },
        ),
      ).toEqual(TWO_MATCHING_PATTERNS_FORM_DATA);
    });
  });
}
