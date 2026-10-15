import type { CustomValidator, RJSFSchema, SchemaParserOptions, ValidatorType } from '../../src/index.ts';
import {
  createSchemaUtils,
  getClosestMatchingOption,
  getDefaultFormState,
  isObject,
  omitExtraData,
  retrieveSchema,
} from '../../src/index.ts';
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

    /** Scores the `choice` options the form renders `p` with, which are the ones the custom merge rewrote */
    function scoreRenderedChoice(validator: ValidatorType) {
      const context = { validator, customMergeAllOf };
      const property = retrieveSchema(context, rootSchema, rootSchema, formData).properties?.p;
      const choice = isObject(property) ? property.properties?.choice : undefined;
      const options = isObject(choice) ? (choice.oneOf ?? []) : [];
      return getClosestMatchingOption(context, rootSchema, formData.p.choice, options.filter(isObject), 0);
    }

    it.each([
      ['without it', undefined],
      ['with it', customMergeAllOf],
    ])('has no function for an option the custom merge rewrites, compiled %s', (_compiled, merge) => {
      // The rewritten option is a schema the merge made, with no place in the root for the compile list to name
      const validator = buildValidator(rootSchema, merge && { customMergeAllOf: merge });
      expect(() => scoreRenderedChoice(validator)).toThrow(
        'No precompiled validator function was found for the given schema',
      );
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
    it("covers the options of a dependency's oneOf in the definition a property's $ref names", () => {
      const rootSchema: RJSFSchema = {
        definitions: { person: SCHEMA_DEPENDENCY_ONE_OF },
        type: 'object',
        properties: { owner: { $ref: '#/definitions/person' } },
      };
      const validator = buildValidator(rootSchema);
      expect(omitExtraData({ validator }, rootSchema, rootSchema, { owner: DEPENDENCY_ONE_OF_FORM_DATA })).toEqual({
        owner: DEPENDENCY_ONE_OF_OMITTED,
      });
    });
    it('has no function for an option the merge of two patternProperties makes', () => {
      // Both patterns match `ab`, and merging their `oneOf`s makes options neither pattern has
      const rootSchema = SCHEMA_TWO_MATCHING_PATTERNS;
      const validator = buildValidator(rootSchema);
      expect(() =>
        getDefaultFormState(
          { validator },
          { schema: rootSchema, rootSchema, formData: TWO_MATCHING_PATTERNS_FORM_DATA },
        ),
      ).toThrow('No precompiled validator function was found for the given schema');
    });
  });

  describe('for the schemas the schema graph names', () => {
    it('validates an if with no else before and after it holds (#5453)', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' } },
        if: { properties: { a: { const: 'x' } }, required: ['a'] },
        then: { properties: { extra: { oneOf: [{ type: 'string' }, { type: 'number' }] } } },
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
      expect(schemaUtils.retrieveSchema(rootSchema, { a: 'y' }).properties).toEqual({ a: { type: 'string' } });
      const extra = schemaUtils.retrieveSchema(rootSchema, { a: 'x', extra: 5 }).properties?.extra;
      const options = isObject(extra) && Array.isArray(extra.oneOf) ? extra.oneOf.filter(isObject) : [];
      expect(schemaUtils.getClosestMatchingOption(5, options, 0)).toBe(1);
    });
    it("scores an option whose own patternProperties stub the data's keys into it (#5454)", () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: {
          v: {
            oneOf: [
              {
                type: 'object',
                properties: { id: { type: 'string' } },
                patternProperties: { '^s_': { type: 'string' }, '^s_n': { pattern: '^x' } },
              },
              { type: 'number' },
            ],
          },
        },
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
      const subFormData = { id: 'a', s_na: 'xx' };
      const field = schemaUtils.retrieveSchema(rootSchema, { v: subFormData }).properties?.v;
      const options = isObject(field) && Array.isArray(field.oneOf) ? field.oneOf.filter(isObject) : [];
      const retrieved = options.map((option) => schemaUtils.retrieveSchema(option, subFormData));
      expect(schemaUtils.getFirstMatchingOption(subFormData, retrieved)).toBe(0);
    });
    it('scores an option that carries an $id, retrieved for the data (#5455)', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: {
          v: {
            oneOf: [
              {
                $id: 'myOption',
                type: 'object',
                properties: { id: { type: 'string' } },
                additionalProperties: { type: 'string' },
                required: ['id'],
              },
              { type: 'number' },
            ],
          },
        },
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
      const subFormData = { extra: 'x' };
      const field = schemaUtils.retrieveSchema(rootSchema, { v: subFormData }).properties?.v;
      const options = isObject(field) && Array.isArray(field.oneOf) ? field.oneOf.filter(isObject) : [];
      const retrieved = options.map((option) => schemaUtils.retrieveSchema(option, subFormData));
      // `extra` is no key the option declares, so neither option matches and the scores decide
      expect(schemaUtils.getClosestMatchingOption({ id: 'a', extra: 'x' }, retrieved, -1)).toBe(0);
      expect(schemaUtils.getClosestMatchingOption(5, retrieved, -1)).toBe(1);
    });
    it('builds for a oneOf of a $ref to the root beside dependencies (#5452 c)', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
        dependencies: { a: ['b'] },
        oneOf: [{ $ref: '#' }, { properties: { c: { type: 'string' } } }],
      };
      expect(() => buildValidator(rootSchema)).not.toThrow();
    });
    it('compiles and matches a boolean option', () => {
      const rootSchema: RJSFSchema = { type: 'object', properties: { v: { anyOf: [false, true] } } };
      const validator = buildValidator(rootSchema);
      expect(validator.isValid({ $ref: '#/properties/v/anyOf/0' }, 1, rootSchema)).toBe(false);
      expect(validator.isValid({ $ref: '#/properties/v/anyOf/1' }, 1, rootSchema)).toBe(true);
    });
    it('compiles and scores a recursive definition used as an option', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          node: {
            type: 'object',
            properties: { n: { type: 'string' }, u: { anyOf: [{ $ref: '#/definitions/node' }, { type: 'string' }] } },
          },
        },
        type: 'object',
        properties: { v: { oneOf: [{ $ref: '#/definitions/node' }, { type: 'number' }] } },
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
      const options = rootSchema.properties?.v;
      const list = isObject(options) && Array.isArray(options.oneOf) ? options.oneOf.filter(isObject) : [];
      expect(schemaUtils.getFirstMatchingOption({ n: 'a', u: { n: 'b' } }, list)).toBe(0);
      expect(schemaUtils.getFirstMatchingOption(5, list)).toBe(1);
    });
  });
}
