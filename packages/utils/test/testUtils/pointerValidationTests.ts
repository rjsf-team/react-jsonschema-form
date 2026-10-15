import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { createSchemaUtils, getDefaultFormState, isObject } from '../../src/index.ts';

/** Returns the `anyOf`/`oneOf` options of the `schema`'s own keyword `key` */
function optionsOf(schema: RJSFSchema | boolean | undefined, key: 'anyOf' | 'oneOf'): RJSFSchema[] {
  const options = isObject(schema) ? schema[key] : undefined;
  return Array.isArray(options) ? options.filter(isObject) : [];
}

/** Runs the cases where what a form hands a validator, a pointer into the root or a copy scoring derives, depends on
 * the validator resolving it as JSON Schema does. Each validator package runs them against its live validator and,
 * where it has one, its precompiled one.
 *
 * @param buildValidator - Returns the package's validator for the `rootSchema`
 */
export default function pointerValidationTests(buildValidator: (rootSchema: RJSFSchema) => ValidatorType) {
  describe('validating by pointers into the root', () => {
    it('chooses an option holding only a required by the keys it requires', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { email: { type: 'string' }, phone: { type: 'string' } },
        anyOf: [
          { title: 'By email', required: ['email'] },
          { title: 'By phone', required: ['phone'] },
        ],
      };
      const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
      const options = optionsOf(rootSchema, 'anyOf');
      expect(schemaUtils.getFirstMatchingOption({ phone: '1' }, options)).toBe(1);
      expect(schemaUtils.getClosestMatchingOption({ phone: '1' }, options)).toBe(1);
    });
    it('applies the dependency oneOf option matched on a property whose name ends in #', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { 'Phone #': { type: 'string', enum: ['Home', 'Work'] } },
        dependencies: {
          'Phone #': {
            oneOf: [
              { properties: { 'Phone #': { enum: ['Home'] }, home: { default: 'HOME' } } },
              { properties: { 'Phone #': { enum: ['Work'] }, ext: { default: 'EXT' } } },
            ],
          },
        },
      };
      const validator = buildValidator(rootSchema);
      expect(getDefaultFormState({ validator }, { schema: rootSchema, formData: { 'Phone #': 'Work' } })).toEqual({
        'Phone #': 'Work',
        ext: 'EXT',
      });
    });
    it('reads the $refs below an option with an $id of its own against that $id, with and without a required', () => {
      const option = (name: string, kind: string, required: string[]): RJSFSchema => ({
        $id: `http://example.com/${name}.json`,
        definitions: { kind: { const: kind } },
        type: 'object',
        properties: { kind: { type: 'string' } },
        not: { properties: { kind: { not: { $ref: '#/definitions/kind' } } } },
        required,
      });
      for (const required of [[], ['kind']]) {
        const rootSchema: RJSFSchema = {
          properties: { p: { oneOf: [option('A', 'a', required), option('B', 'b', required)] } },
        };
        const schemaUtils = createSchemaUtils({ validator: buildValidator(rootSchema) }, rootSchema);
        const options = optionsOf(rootSchema.properties?.p, 'oneOf');
        expect(schemaUtils.getFirstMatchingOption({ kind: 'b' }, options)).toBe(1);
        expect(schemaUtils.getClosestMatchingOption({ kind: 'b' }, options)).toBe(1);
      }
    });
    it('reads a boolean if, and a boolean property of a dependency oneOf option, as what they say', () => {
      const conditional: RJSFSchema = {
        type: 'object',
        if: false,
        then: { properties: { t: { default: 'THEN' } } },
        else: { properties: { e: { default: 'ELSE' } } },
      };
      expect(
        getDefaultFormState({ validator: buildValidator(conditional) }, { schema: conditional, formData: {} }),
      ).toEqual({ e: 'ELSE' });
      const dependent: RJSFSchema = {
        properties: { a: { type: 'string' } },
        dependencies: {
          a: {
            oneOf: [
              { properties: { a: false, one: { default: 'ONE' } } },
              { properties: { a: true, two: { default: 'TWO' } } },
            ],
          },
        },
      };
      expect(
        getDefaultFormState({ validator: buildValidator(dependent) }, { schema: dependent, formData: { a: 'z' } }),
      ).toEqual({ a: 'z', two: 'TWO' });
    });
  });
}
