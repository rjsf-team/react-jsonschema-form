import type { RJSFMarkedSchema, SchemaUtilsType, RJSFSchema } from '../../src/index.ts';
import {
  createSchemaUtils,
  getItemSchema,
  getPrefixLength,
  GUESSED_TYPE_FLAG,
  sanitizeDataForNewSchema,
  setByPath,
} from '../../src/index.ts';
import { FIRST_ONE_OF, oneOfData, oneOfSchema, SECOND_ONE_OF } from '../testUtils/testData.ts';
import type { TestValidatorType } from './types.ts';

export default function sanitizeDataForNewSchemaTest(testValidator: TestValidatorType) {
  describe('sanitizeDataForNewSchema', () => {
    const oldDisjointSchema: RJSFSchema = {
      type: 'object',
      properties: {
        idCode: { type: 'string' },
      },
    };
    const newArraySchema: RJSFSchema = {
      type: 'object',
      properties: {
        values: { type: 'array', default: [], items: { type: 'string', enum: ['a', 'b'] } },
      },
    };
    let schemaUtils: SchemaUtilsType;
    beforeAll(() => {
      schemaUtils = createSchemaUtils({ validator: testValidator }, oneOfSchema);
    });
    it('returns undefined when the new schema does not contain a "property" object', () => {
      expect(sanitizeDataForNewSchema({ validator: testValidator }, oneOfSchema, {}, {})).toBeUndefined();
    });
    it('returns input formData when the old schema is not an object', () => {
      const newSchema = schemaUtils.retrieveSchema(SECOND_ONE_OF, oneOfSchema);
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, oneOfSchema, newSchema, undefined, oneOfData),
      ).toEqual(oneOfData);
    });
    it('returns an array it leaves unchanged as it is', () => {
      const arraySchema: RJSFSchema = { type: 'array', items: { type: 'string' } };
      const data = ['a', 'b'];
      expect(sanitizeDataForNewSchema({ validator: testValidator }, arraySchema, arraySchema, arraySchema, data)).toBe(
        data,
      );
    });
    it('handles boolean property schemas without crashing', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: true },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: false },
      };
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, oneOfSchema, newSchema, oldSchema, { foo: 'x' }),
      ).toEqual({
        foo: 'x',
      });
    });
    it('handles an explicitly undefined property schema without crashing', () => {
      // A JS-authored schema can conditionally omit a property with `{ properties: { foo: cond ? {...} : undefined } }`
      const oldSchema = { type: 'object', properties: { foo: {} } } as RJSFSchema;
      const newSchema = { type: 'object', properties: { foo: undefined } } as unknown as RJSFSchema;
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, oneOfSchema, newSchema, oldSchema, { foo: 'x' }),
      ).toEqual({
        foo: 'x',
      });
    });
    it('returns input formData when the old schema does not contain a "property" object', () => {
      const newSchema = schemaUtils.retrieveSchema(SECOND_ONE_OF, oneOfSchema);
      expect(sanitizeDataForNewSchema({ validator: testValidator }, oneOfSchema, newSchema, {}, oneOfData)).toEqual(
        oneOfData,
      );
    });
    it('restores the default for an undefined property that is newly defined by the new schema', () => {
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          firstName: { type: 'string', default: 'Chuck' },
        },
      };

      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldDisjointSchema, {
          firstName: undefined,
          idCode: undefined,
        }),
      ).toEqual({ firstName: 'Chuck', idCode: undefined });
    });
    it('restores an empty array default for an undefined property newly defined by the new schema', () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(newArraySchema, oldDisjointSchema, {
          values: undefined,
          idCode: undefined,
        }),
      ).toEqual({ values: [], idCode: undefined });
    });
    it('sanitizes array data already present for a property newly defined by the new schema', () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(newArraySchema, oldDisjointSchema, {
          values: ['a', 'x'],
          idCode: undefined,
        }),
      ).toEqual({ values: ['a'], idCode: undefined });
    });
    it('continues sanitizing an existing array when the old schema omits its type', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          values: { items: { type: 'string' } },
        },
      };

      // An old schema declaring no type allows any value, so the array is filtered by the new items' enum rather than
      // cleared
      expect(schemaUtils.sanitizeDataForNewSchema(newArraySchema, oldSchema, { values: ['existing'] })).toEqual({
        values: [],
      });
    });
    it('keeps the data of a property whose type was guessed from it, even when that type changed', () => {
      const guessedSchema = (type: RJSFSchema['type']): RJSFSchema => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: true,
          properties: { aKey: { type } },
        };
        (schema.properties!.aKey as RJSFMarkedSchema)[GUESSED_TYPE_FLAG] = true;
        return schema;
      };

      expect(
        schemaUtils.sanitizeDataForNewSchema(guessedSchema('number'), guessedSchema('string'), { aKey: 42 }),
      ).toEqual({ aKey: 42 });
    });
    it.each([undefined, false])('clears the data of a property whose guessed type flag is %s', (flag) => {
      const flaggedSchema = (type: RJSFSchema['type']): RJSFSchema => {
        const aKey: RJSFMarkedSchema = { type, [GUESSED_TYPE_FLAG]: flag };
        return { type: 'object', additionalProperties: true, properties: { aKey } };
      };

      expect(
        schemaUtils.sanitizeDataForNewSchema(flaggedSchema('number'), flaggedSchema('string'), { aKey: 'text' }),
      ).toEqual({});
    });
    it('clears the data of a property whose guessed type the new schema replaces with one of its own', () => {
      const freeFormSchema: RJSFSchema = {
        type: 'object',
        additionalProperties: true,
        properties: { aKey: { type: 'string' } },
      };
      (freeFormSchema.properties!.aKey as RJSFMarkedSchema)[GUESSED_TYPE_FLAG] = true;
      const typedSchema: RJSFSchema = {
        type: 'object',
        properties: { aKey: { type: 'number' } },
      };

      // The new schema requires a number of the key the old one merely happened to hold a string in, so the string
      // is cleared rather than left sitting in a number field
      expect(schemaUtils.sanitizeDataForNewSchema(typedSchema, freeFormSchema, { aKey: 'text' })).toEqual({});
    });
    describe('keys and objects the new schema does not take', () => {
      const withX = (x: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { x } });
      const xWith = (key: string, extra?: RJSFSchema): RJSFSchema => ({
        type: 'object',
        ...extra,
        properties: { [key]: { type: 'string' } },
      });
      it('removes a key only the old schema declares rather than setting it to undefined', () => {
        expect(schemaUtils.sanitizeDataForNewSchema(newArraySchema, oldDisjointSchema, { idCode: 'x' })).toStrictEqual({
          values: [],
        });
      });
      it('removes a key whose type the new schema changes rather than setting it to undefined', () => {
        const numberId: RJSFSchema = { type: 'object', properties: { idCode: { type: 'number' } } };
        expect(schemaUtils.sanitizeDataForNewSchema(numberId, oldDisjointSchema, { idCode: 'x' })).toStrictEqual({});
      });
      it('removes a nested key only the old schema declares', () => {
        expect(
          schemaUtils.sanitizeDataForNewSchema(withX(xWith('q')), withX(xWith('p')), { x: { p: 'v' } }),
        ).toStrictEqual({ x: {} });
      });
      it('removes a cleared nested key only the old schema declares, where the object takes extra keys', () => {
        const open = { additionalProperties: true } as RJSFSchema;
        expect(
          schemaUtils.sanitizeDataForNewSchema(withX(xWith('q', open)), withX(xWith('p', open)), {
            x: { p: undefined },
          }),
        ).toStrictEqual({ x: {} });
      });
      it('leaves out an object property the data does not hold', () => {
        const optional: RJSFSchema = {
          type: 'object',
          properties: { k: { type: 'string' }, opt: { type: 'object', properties: { x: { type: 'string' } } } },
        };
        expect(schemaUtils.sanitizeDataForNewSchema(optional, optional, { k: 'a' })).toStrictEqual({ k: 'a' });
        expect(schemaUtils.sanitizeDataForNewSchema(optional, optional, { k: 'a', opt: undefined })).toStrictEqual({
          k: 'a',
          opt: undefined,
        });
      });
      it('still replaces a value of another type with an empty object', () => {
        expect(schemaUtils.sanitizeDataForNewSchema(withX(xWith('q')), withX({}), { x: 'stale' })).toStrictEqual({
          x: {},
        });
      });
    });
    it('preserves explicit undefined data for a property shared by both schemas', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          firstName: { type: 'string', default: 'Chuck' },
        },
      };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { firstName: undefined })).toEqual({
        firstName: undefined,
      });
    });
    it('returns input formData when the new schema matches the data for the new schema rather than the old', () => {
      const newSchema = schemaUtils.retrieveSchema(SECOND_ONE_OF, oneOfSchema);
      const oldSchema = structuredClone(schemaUtils.retrieveSchema(FIRST_ONE_OF, oneOfSchema));
      // Change the type of name to trigger a fall-thru
      setByPath(oldSchema, ['properties', 'name', 'type'], 'boolean');
      // By changing the type, the name will be marked as undefined
      const expected = { ...oneOfData, name: undefined };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, oneOfData)).toEqual(expected);
    });
    it('returns input formData when the new schema and old schema match on a default', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          defaultField: {
            type: 'string',
            default: 'myData',
          },
          anotherField: {
            type: 'boolean',
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          defaultField: {
            type: 'string',
            default: 'myData',
          },
          anotherField: {
            type: 'string',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          notInEitherSchema: 'keep',
          defaultField: 'myData',
          anotherField: true,
        }),
      ).toEqual({ notInEitherSchema: 'keep', defaultField: 'myData' });
    });
    it('returns new schema const in formData when the old schema default matches in the formData', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          defaultField: {
            type: 'string',
            default: 'myData',
          },
          anotherField: {
            type: 'boolean',
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          defaultField: {
            type: 'string',
            default: 'yourData',
          },
          anotherField: {
            type: 'string',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          defaultField: 'myData',
          anotherField: true,
        }),
      ).toEqual({ defaultField: 'yourData' });
    });
    it('returns input formData when the old schema default does not match in the formData', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          defaultField: {
            type: 'string',
            default: 'myData',
          },
          anotherField: {
            type: 'boolean',
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          defaultField: {
            type: 'string',
            default: 'yourData',
          },
          anotherField: {
            type: 'string',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          defaultField: 'fooData',
          anotherField: true,
        }),
      ).toEqual({ defaultField: 'fooData' });
    });
    it('returns empty formData when the old schema default does not match in the formData, and new schema default is readOnly', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          defaultField: {
            type: 'string',
            default: 'myData',
          },
          anotherField: {
            type: 'boolean',
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          defaultField: {
            type: 'string',
            default: 'yourData',
            readOnly: true,
          },
          anotherField: {
            type: 'string',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          defaultField: 'fooData',
          anotherField: true,
        }),
      ).toEqual({});
    });
    it('returns input formData when the new schema and old schema match on a const', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          constField: {
            type: 'string',
            const: 'myData',
          },
          anotherField: {
            type: 'boolean',
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          constField: {
            type: 'string',
            const: 'myData',
          },
          anotherField: {
            type: 'string',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          notInEitherSchema: 'keep',
          constField: 'myData',
          anotherField: true,
        }),
      ).toEqual({ notInEitherSchema: 'keep', constField: 'myData' });
    });
    it('returns new schema const in formData when the old schema const matches in the formData', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          constField: {
            type: 'string',
            const: 'myData',
          },
          anotherField: {
            type: 'boolean',
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          constField: {
            type: 'string',
            const: 'yourData',
          },
          anotherField: {
            type: 'string',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          constField: 'myData',
          anotherField: true,
        }),
      ).toEqual({ constField: 'yourData' });
    });
    it('returns empty formData when the old schema const does not match in the formData', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          constField: {
            type: 'string',
            const: 'myData',
          },
          anotherField: {
            type: 'boolean',
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          constField: {
            type: 'string',
            const: 'yourData',
          },
          anotherField: {
            type: 'string',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          constField: 'fooData',
          anotherField: true,
        }),
      ).toEqual({});
    });
    it('replaces invalid enum data with the only allowed enum value', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['oldData'],
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['newData'],
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          enumField: 'oldData',
        }),
      ).toEqual({
        enumField: 'newData',
      });
    });
    it('keeps enum data that is still allowed by the new schema', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['keptData'],
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['keptData', 'newData'],
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          enumField: 'keptData',
        }),
      ).toEqual({
        enumField: 'keptData',
      });
    });
    it('replaces invalid enum data with a valid new default when multiple enum values are allowed', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['oldData'],
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['newData', 'defaultData'],
            default: 'defaultData',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          enumField: 'oldData',
        }),
      ).toEqual({
        enumField: 'defaultData',
      });
    });
    it('clears invalid enum data when multiple values are allowed and no valid default exists', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['oldData'],
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['newData', 'otherData'],
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          enumField: 'oldData',
        }),
      ).toStrictEqual({});
    });
    it('replaces invalid oneOf const and enum data', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['oldData'],
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            oneOf: [{ const: 'newData' }, { enum: ['otherData'] }, { enum: ['ignoredData', 'extraIgnoredData'] }],
            default: 'otherData',
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          enumField: 'oldData',
        }),
      ).toEqual({
        enumField: 'otherData',
      });
    });
    it('keeps a value an option that is not a constant accepts', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { k: { const: 'a' }, email: { type: 'string' } } };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          k: { const: 'b' },
          email: { type: 'string', anyOf: [{ const: 'none' }, { type: 'string', format: 'email' }] },
        },
      };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { k: 'a', email: 'x@y.z' })).toEqual({
        k: 'b',
        email: 'x@y.z',
      });
    });
    it('replaces invalid anyOf const data with the only allowed value', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['oldData'],
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            anyOf: [{ const: 'newData' }],
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          enumField: 'oldData',
        }),
      ).toEqual({
        enumField: 'newData',
      });
    });
    it('checks data against the anyOf, the rendered select, when a schema carries both keywords (#5309)', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: { field: { anyOf: [{ const: 1 }, { const: 2 }], oneOf: [{ const: 'a' }] } },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { field: { anyOf: [{ const: 1 }, { const: 2 }], oneOf: [{ const: 'b' }] } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { field: 2 })).toEqual({ field: 2 });
    });
    it('clears data that no value of a multi-value enum option allows', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            enum: ['oldData'],
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          enumField: {
            type: 'string',
            oneOf: [{ enum: ['ignoredData', 'extraIgnoredData'] }],
          },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          enumField: 'oldData',
        }),
      ).toStrictEqual({});
    });
    it('keeps data when the options offer no value at all', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { x: { type: 'string' } } };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { x: { type: 'string', oneOf: [{ enum: [] }] } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { x: 'b' })).toEqual({ x: 'b' });
    });
    it('keeps data when a direct enum offers no value at all', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { x: { type: 'string' } } };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { x: { type: 'string', enum: [] } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { x: 'b' })).toEqual({ x: 'b' });
    });
    it('leaves an empty enum beside a list of constant options to that list', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { x: { type: 'string' } } };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { x: { type: 'string', enum: [], oneOf: [{ const: 'a' }] } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { x: 'b' })).toEqual({ x: 'a' });
    });
    it('keeps data that a multi-value enum option beside a const allows', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { x: { type: 'string' } } };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { x: { type: 'string', anyOf: [{ const: 'z' }, { enum: ['a', 'b'] }] } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { x: 'b' })).toEqual({ x: 'b' });
    });
    it('returns empty formData after resolving schema refs', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          string_def: {
            type: 'string',
          },
        },
      };
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          field: {
            $ref: '#/definitions/string_def',
          },
          oldField: {
            type: 'string',
          },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          field: {
            $ref: '#/definitions/string_def',
          },
        },
      };
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, rootSchema, newSchema, oldSchema, { oldField: 'test' }),
      ).toEqual({});
    });
    it('resolves a dependency nested inside a property before sanitizing its data (#5250)', () => {
      // The root schema itself has no top-level `dependencies`, so its own retrieved form is identical whether
      // `animal` is "Cat" or "Fish" -- only calling retrieveSchema() on the `m` property itself (as
      // sanitizeDataForNewSchema now does) picks up the active `food` branch for the current `animal` value.
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: {
          m: {
            type: 'object',
            properties: {
              animal: { type: 'string', enum: ['Cat', 'Fish'] },
            },
            dependencies: {
              animal: {
                oneOf: [
                  { properties: { animal: { enum: ['Cat'] }, food: { type: 'string', enum: ['meat'] } } },
                  { properties: { animal: { enum: ['Fish'] }, food: { type: 'string', enum: ['worms'] } } },
                ],
              },
            },
          },
        },
      };
      // The old and new schema for `m` are identical here, so its dependency is only resolved once (not once per
      // side); that resolution checks both oneOf branches: the "Cat" branch matches, the "Fish" branch does not.
      testValidator.setReturnValues({ isValid: [true, false] });
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, rootSchema, rootSchema, rootSchema, {
          m: { animal: 'Cat', food: 'worms' },
        }),
      ).toEqual({ m: { animal: 'Cat', food: 'meat' } });
    });
    it('resolves a dependency nested inside array items, per item, before sanitizing its data (#5250)', () => {
      const rootSchema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            animal: { type: 'string', enum: ['Cat', 'Fish'] },
          },
          dependencies: {
            animal: {
              oneOf: [
                { properties: { animal: { enum: ['Cat'] }, food: { type: 'string', enum: ['meat'] } } },
                { properties: { animal: { enum: ['Fish'] }, food: { type: 'string', enum: ['worms'] } } },
              ],
            },
          },
        },
      };
      // Each of the two array items resolves its own dependency independently: item 0 matches the "Cat" branch,
      // item 1 matches the "Fish" branch. The old and new items schema is identical, so each item's dependency is
      // only resolved once (not once per side).
      testValidator.setReturnValues({ isValid: [true, false, false, true] });
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, rootSchema, rootSchema, rootSchema, [
          { animal: 'Cat', food: 'worms' },
          { animal: 'Fish', food: 'meat' },
        ]),
      ).toEqual([
        { animal: 'Cat', food: 'meat' },
        { animal: 'Fish', food: 'worms' },
      ]);
    });
    it('resolves an items schema whose object type and dependency are only reachable through allOf, not a direct $ref (#5250)', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          Animal: {
            type: 'object',
            properties: {
              animal: { type: 'string', enum: ['Cat', 'Fish'] },
            },
            dependencies: {
              animal: {
                oneOf: [
                  { properties: { animal: { enum: ['Cat'] }, food: { type: 'string', enum: ['meat'] } } },
                  { properties: { animal: { enum: ['Fish'] }, food: { type: 'string', enum: ['worms'] } } },
                ],
              },
            },
          },
        },
        type: 'array',
        // No direct `$ref` on `items` itself -- the object type and the nested dependency are only visible after
        // resolving the `allOf` wrapper, which the array-items type check must do to detect them (#5250).
        items: {
          allOf: [{ $ref: '#/definitions/Animal' }],
        },
      };
      testValidator.setReturnValues({ isValid: [true, false, false, true] });
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, rootSchema, rootSchema, rootSchema, [
          { animal: 'Cat', food: 'worms' },
          { animal: 'Fish', food: 'meat' },
        ]),
      ).toEqual([
        { animal: 'Cat', food: 'meat' },
        { animal: 'Fish', food: 'worms' },
      ]);
    });
    it('keeps the items of an array whose type list also allows null, as it does for a plain array', () => {
      const oldSchema: RJSFSchema = { type: ['array', 'null'], items: { type: 'string' }, minItems: 1 };
      const newSchema: RJSFSchema = { type: ['null', 'array'], items: { type: 'string' }, maxItems: 3 };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['x', 'y'])).toEqual(['x', 'y']);
    });
    it('returns undefined for array data when the type list of either schema resolves to a type other than array', () => {
      const oldSchema: RJSFSchema = { type: ['string', 'array'], items: { type: 'string' } };
      const newSchema: RJSFSchema = { type: ['array', 'null'], items: { type: 'string' } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['x'])).toBeUndefined();
    });
    it('keeps the value of a property both schemas give the same type list in separate schemas', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          name: { type: ['string', 'null'], title: 'Old' },
          tags: { type: ['array', 'null'], items: { type: 'string', enum: ['a', 'b'] } },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          name: { type: ['string', 'null'], title: 'New' },
          tags: { type: ['array', 'null'], items: { type: 'string', enum: ['a'] }, maxItems: 1 },
        },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { name: 'x', tags: ['b', 'a', 'a'] })).toEqual({
        name: 'x',
        tags: ['a'],
      });
    });
    it('keeps the value of a property whose type lists name the same types in another order', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { name: { type: ['string', 'null'] } } };
      const newSchema: RJSFSchema = { type: 'object', properties: { name: { type: ['null', 'string', 'null'] } } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { name: 'x' })).toEqual({ name: 'x' });
    });
    it('clears the value of a property whose type list names a type the other does not', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { name: { type: ['string', 'null'] } } };
      const newSchema: RJSFSchema = { type: 'object', properties: { name: { type: ['number', 'null'] } } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { name: 'x' })).toEqual({ name: undefined });
    });
    it('clears the value of a property whose type list allows more types than the other names', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { name: { type: ['string', 'null'] } } };
      const newSchema: RJSFSchema = { type: 'object', properties: { name: { type: ['string'] } } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { name: 'x' })).toEqual({ name: undefined });
    });
    it('keeps the value of a typeless property whose const is an array, which declares no array to sanitize', () => {
      const oldSchema: RJSFSchema = { type: 'object', properties: { pair: { const: [1, 2] }, b: { type: 'string' } } };
      const newSchema: RJSFSchema = { type: 'object', properties: { pair: { const: [1, 2] }, c: { type: 'string' } } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { pair: [1, 2], b: 'x' })).toEqual({
        pair: [1, 2],
        b: undefined,
      });
    });
    it('keeps the items of an array whose two items schemas give the same type list in separate schemas', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: { type: ['string', 'null'], title: 'Old' } };
      const newSchema: RJSFSchema = { type: 'array', items: { type: ['string', 'null'], title: 'New' } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['x', null])).toEqual(['x', null]);
    });
    it('keeps a nullable tuple property that both schemas describe alike in separate schemas', () => {
      const coords = (): RJSFSchema => ({ type: ['array', 'null'], items: [{ type: 'number' }, { type: 'number' }] });
      const oldSchema: RJSFSchema = { type: 'object', properties: { flag: { type: 'boolean' }, coords: coords() } };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { flag: { type: 'boolean' }, coords: coords(), extra: { type: 'string' } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { flag: true, coords: [1, 2] })).toEqual({
        flag: true,
        coords: [1, 2],
      });
    });
    it('keeps a tuple that both schemas describe alike, up to the new maxItems', () => {
      const tuple: RJSFSchema = {
        items: [{ type: 'string' }, { type: 'number' }],
        additionalItems: { type: 'string' },
      };
      const oldSchema: RJSFSchema = { type: 'array', ...tuple, minItems: 2 };
      const newSchema: RJSFSchema = { type: 'array', ...tuple, maxItems: 2 };
      expect(schemaUtils.sanitizeDataForNewSchema(oldSchema, newSchema, ['x', 1, 'more'])).toEqual(['x', 1, 'more']);
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['x', 1, 'more'])).toEqual(['x', 1]);
    });
    it('keeps the items of arrays that declare only the same prefixItems, or no items at all', () => {
      const prefixItems = [{ type: 'string' }];
      const oldSchema = { type: 'array', prefixItems, minItems: 1 } as RJSFSchema;
      const newSchema = { type: 'array', prefixItems, maxItems: 3 } as RJSFSchema;
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['x'])).toEqual(['x']);
      expect(schemaUtils.sanitizeDataForNewSchema({ type: 'array' }, { type: 'array' }, ['x', 1])).toEqual(['x', 1]);
    });
    describe('getItemSchema() and getPrefixLength()', () => {
      const first: RJSFSchema = { type: 'string' };
      const rest: RJSFSchema = { type: 'number' };
      it.each<[string, RJSFSchema, number, (RJSFSchema | boolean)[]]>([
        ['prefixItems', { prefixItems: [first], items: rest }, 1, [first, rest]],
        ['a tuple items', { items: [first], additionalItems: rest }, 1, [first, rest]],
        ['a closed tuple', { items: [first], additionalItems: false }, 1, [first, false]],
        ['a single items', { items: rest }, 0, [rest, rest]],
        ['no items', {}, 0, [true, true]],
        ['a null items', { items: null } as unknown as RJSFSchema, 0, [true, true]],
        ['an array items beside prefixItems', { prefixItems: [first], items: [rest] }, 1, [first, true]],
        [
          'one tuple shared by prefixItems and items',
          (() => {
            const tuple = [first];
            return { prefixItems: tuple, items: tuple, additionalItems: false };
          })(),
          1,
          [first, true],
        ],
      ])('reads the item schemas of %s by position', (_, schema, length, expected) => {
        expect(getPrefixLength(schema)).toBe(length);
        expect([getItemSchema(schema, 0), getItemSchema(schema, 1)]).toStrictEqual(expected);
      });
    });
    describe('an array whose items are described by position', () => {
      const prefixed = (prefix: RJSFSchema): RJSFSchema => ({
        type: 'array',
        prefixItems: [prefix],
        items: { type: 'string', enum: ['a'] },
      });
      it('reads a prefix item against its own prefixItems entry, rather than shifting it', () => {
        const schema = prefixed({ type: 'number' });
        expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [1, 'a'])).toStrictEqual([1, 'a']);
      });
      it('drops an item past the prefix the new items reject, and is cleared where a prefix item is rejected', () => {
        const schema = prefixed({ type: 'number', enum: [1] });
        expect(schemaUtils.sanitizeDataForNewSchema(schema, {}, [1, 'b', 'a'])).toStrictEqual([1, 'a']);
        expect(schemaUtils.sanitizeDataForNewSchema(schema, {}, [2, 'a'])).toBeUndefined();
      });
      it('keeps an unfilled prefix item as a hole, and a rejected one both sides declare alike as it is', () => {
        const schema = prefixed({ type: 'number', enum: [1] });
        expect(schemaUtils.sanitizeDataForNewSchema(schema, {}, [undefined, 'a'])).toStrictEqual([undefined, 'a']);
        expect(schemaUtils.sanitizeDataForNewSchema(schema, { ...schema, title: 'Old' }, [2, 'a'])).toStrictEqual([
          2,
          'a',
        ]);
      });
      it('keeps an unfilled prefix item as a hole where its position changes type, rather than clearing the array', () => {
        const prefixed = (type: 'string' | 'number'): RJSFSchema => ({
          type: 'array',
          prefixItems: [{ type }],
          items: { type: 'string' },
        });
        expect(
          schemaUtils.sanitizeDataForNewSchema(prefixed('number'), prefixed('string'), [undefined, 'a']),
        ).toStrictEqual([undefined, 'a']);
        expect(
          schemaUtils.sanitizeDataForNewSchema(prefixed('number'), prefixed('string'), ['x', 'a']),
        ).toBeUndefined();
      });
      it('drops an unfilled item past the prefix where its position changes type, rather than clearing the array', () => {
        const shorter = { type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'string' } } as RJSFSchema;
        const longer = { type: 'array', prefixItems: [{ type: 'string' }, { type: 'number' }] } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(shorter, longer, ['a', undefined])).toStrictEqual(['a']);
        const items = (type: 'string' | 'number'): RJSFSchema => ({ type: 'array', items: { type } });
        expect(schemaUtils.sanitizeDataForNewSchema(items('string'), items('number'), [undefined])).toStrictEqual([]);
        expect(
          schemaUtils.sanitizeDataForNewSchema(items('string'), items('number'), [undefined, 'b']),
        ).toBeUndefined();
      });
      it('clears the array for an unfilled item at a position the new schema allows none at', () => {
        const closed: RJSFSchema = { type: 'array', items: [{ type: 'string' }], additionalItems: false };
        expect(
          schemaUtils.sanitizeDataForNewSchema(closed, { type: 'array', items: { type: 'string' } }, ['a', undefined]),
        ).toBeUndefined();
      });
      it('keeps an unfilled prefix item as a hole where its position holds objects', () => {
        const objects = prefixed({ type: 'object', properties: { a: { type: 'string', default: 'x' } } });
        expect(schemaUtils.sanitizeDataForNewSchema(objects, {}, [undefined, 'a'])).toStrictEqual([undefined, 'a']);
      });
      it('keeps a rejected prefix item whose position both sides constrain alike, whatever labels they differ in', () => {
        const titled = (title: string): RJSFSchema => prefixed({ type: 'number', enum: [1], title });
        expect(schemaUtils.sanitizeDataForNewSchema(titled('New'), titled('Old'), [2, 'a'])).toStrictEqual([2, 'a']);
        const untypedOld = { prefixItems: [{ type: 'string', enum: [1] }] } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(titled('New'), untypedOld, [2, 'a'])).toStrictEqual([2, 'a']);
        const withDefault = (value: number): RJSFSchema => prefixed({ type: 'number', enum: [1, 3], default: value });
        expect(schemaUtils.sanitizeDataForNewSchema(withDefault(3), withDefault(1), [2, 'a'])).toStrictEqual([2, 'a']);
        const narrower = prefixed({ type: 'number', enum: [1, 3] });
        expect(schemaUtils.sanitizeDataForNewSchema(titled('New'), narrower, [2, 'a'])).toBeUndefined();
      });
      it("keeps an unfilled item as a hole where the new items' const is one the old items didn't declare", () => {
        const items = (extra: RJSFSchema): RJSFSchema => ({ type: 'array', items: { type: 'string', ...extra } });
        expect(schemaUtils.sanitizeDataForNewSchema(items({ const: 'a' }), items({}), ['b', undefined])).toStrictEqual([
          undefined,
        ]);
      });
      it("checks a scalar item against the const its items' conditional gives that item, not the whole array", () => {
        const items: RJSFSchema = { type: 'string', if: { type: 'string' }, then: {}, else: { const: 'x' } };
        testValidator.setReturnValues({ isValid: [false, true, true] });
        expect(
          schemaUtils.sanitizeDataForNewSchema({ type: 'array', items }, { type: 'array', items: { type: 'string' } }, [
            'a',
            'b',
          ]),
        ).toStrictEqual(['a', 'b']);
      });
      it('sanitizes each tuple item against the schemas both sides declare at its position', () => {
        const row = (...keys: string[]): RJSFSchema => ({
          type: 'object',
          properties: Object.fromEntries(keys.map((key) => [key, { type: 'string' }])),
        });
        const tuple = (first: RJSFSchema): RJSFSchema => ({ type: 'array', items: [first, { type: 'number' }] });
        expect(
          schemaUtils.sanitizeDataForNewSchema(tuple(row('x')), tuple(row('x', 'y')), [{ x: 'a', y: 'b' }, 1]),
        ).toStrictEqual([{ x: 'a' }, 1]);
      });
      it('is cleared where an item reaches a position the two sides give different types, and kept where none does', () => {
        const tuple = (second: RJSFSchema): RJSFSchema => ({ type: 'array', items: [{ type: 'string' }, second] });
        const changed = (data: unknown[]) =>
          schemaUtils.sanitizeDataForNewSchema(tuple({ type: 'string' }), tuple({ type: 'number' }), data);
        expect(changed(['a', 1])).toBeUndefined();
        expect(changed(['a'])).toStrictEqual(['a']);
        const strings: RJSFSchema = { type: 'array', items: { type: 'string' } };
        expect(schemaUtils.sanitizeDataForNewSchema(strings, { type: 'array', items: { type: 'number' } }, [])).toEqual(
          [],
        );
      });
      it('keeps the items a closed tuple holds, where no item reaches its false', () => {
        const closed = { type: 'array', prefixItems: [{ type: 'string' }], items: false } as RJSFSchema;
        const strings: RJSFSchema = { type: 'array', items: { type: 'string' } };
        expect(schemaUtils.sanitizeDataForNewSchema(closed, strings, ['a'])).toStrictEqual(['a']);
        expect(schemaUtils.sanitizeDataForNewSchema(closed, strings, ['a', 'b'])).toBeUndefined();
      });
    });
    it('returns undefined for a tuple whose additionalItems the two schemas describe differently', () => {
      const items: RJSFSchema['items'] = [{ type: 'string' }];
      const oldSchema: RJSFSchema = { type: 'array', items, additionalItems: { type: 'string' } };
      const newSchema: RJSFSchema = { type: 'array', items, additionalItems: { type: 'number' } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['x', 'y'])).toBeUndefined();
    });
    it('sanitizes a nullable object property per property, as a plain object property is', () => {
      const addr = (withZip: boolean): RJSFSchema => ({
        type: 'object',
        properties: {
          addr: {
            type: ['object', 'null'],
            properties: { street: { type: 'string' }, ...(withZip ? { zip: { type: 'string' } } : {}) },
          },
        },
      });
      expect(
        schemaUtils.sanitizeDataForNewSchema(addr(false), addr(true), { addr: { street: 'x', zip: '1' } }),
      ).toEqual({ addr: { street: 'x', zip: undefined } });
      expect(schemaUtils.sanitizeDataForNewSchema(addr(false), addr(true), { addr: null })).toEqual({ addr: null });
    });
    it('leaves out an object property the data does not hold, without descending into a recursive $ref', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          node: { type: 'object', properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } } },
        },
      };
      const treeOption: RJSFSchema = { type: 'object', properties: { tree: { $ref: '#/definitions/node' } } };
      const otherOption: RJSFSchema = { type: 'object', properties: { b: { type: 'string' } } };
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, rootSchema, treeOption, otherOption, { b: 'v' }),
      ).toStrictEqual({});
    });
    it('leaves out an object property the data does not hold whose schema declares no properties', () => {
      const newSchema: RJSFSchema = { type: 'object', properties: { meta: { type: 'object' } } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldDisjointSchema, {})).toEqual({});
    });
    it('keeps a value of another type that a type list naming object allows', () => {
      const schema = (title: string): RJSFSchema => ({
        type: 'object',
        properties: { value: { type: ['object', 'string'], title, properties: { a: { type: 'string' } } } },
      });
      expect(schemaUtils.sanitizeDataForNewSchema(schema('New'), schema('Old'), { value: 'x' })).toEqual({
        value: 'x',
      });
    });
    it('returns undefined for an array the new schema has a const for that it does not equal', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: { type: 'string' }, minItems: 1 };
      const newSchema: RJSFSchema = { type: 'array', items: { type: 'string' }, const: ['a', 'b'] };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['x'])).toBeUndefined();
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['a', 'b'])).toEqual(['a', 'b']);
    });
    it('returns undefined for an array the new schema selects whole values from that it does not list', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: { type: 'string' }, minItems: 1 };
      const newSchema: RJSFSchema = { type: 'array', items: { type: 'string' }, enum: [['a'], ['b']] };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['x'])).toBeUndefined();
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['b'])).toEqual(['b']);
    });
    it.each<[string, RJSFSchema]>([
      ['const', { type: 'array', items: { type: 'string' }, const: ['a', 'b'] }],
      ['enum of whole arrays', { type: 'array', items: { type: 'string' }, enum: [['a'], ['b']] }],
    ])('keeps an array the old schema rejected by the same %s', (_, schema) => {
      expect(schemaUtils.sanitizeDataForNewSchema(schema, { ...schema, title: 'Old' }, ['x'])).toEqual(['x']);
    });
    it('keeps an array whose const is an ajv $data reference rather than a value', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          other: { type: 'array', items: { type: 'string' } },
          copy: { type: 'array', items: { type: 'string' }, const: { $data: '1/other' } as unknown as string[] },
        },
      };
      const data = { other: ['a'], copy: ['a'] };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, data)).toEqual(data);
      const withoutConst: RJSFSchema = {
        type: 'object',
        properties: { other: schema.properties!.other, copy: { type: 'array', items: { type: 'string' } } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, withoutConst, data)).toEqual(data);
    });
    it('returns data when two arrays have same boolean items', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: true,
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: true,
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1])).toEqual([1]);
    });
    it('keeps the items of an array both schemas declare items: false for, for validation to report', () => {
      const schema: RJSFSchema = { type: 'array', items: false };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, { ...schema, title: 'Old' }, [1])).toEqual([1]);
    });
    it('trims an array whose boolean items both schemas share to the new maxItems', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: true };
      const newSchema: RJSFSchema = { type: 'array', items: true, maxItems: 2 };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1, 2, 3])).toEqual([1, 2]);
      // A fractional `maxItems` is invalid, but it still bounds the items, as the length it rounds up to
      expect(schemaUtils.sanitizeDataForNewSchema({ ...newSchema, maxItems: 1.5 }, oldSchema, [1, 2, 3])).toStrictEqual(
        [1, 2],
      );
    });
    it('returns data when two arrays share boolean items and differ only in the additionalItems they ignore', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: true, additionalItems: { type: 'string' } };
      const newSchema: RJSFSchema = { type: 'array', items: true };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['a', 1])).toEqual(['a', 1]);
    });
    it('returns undefined when two tuples differ in their additionalItems', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: [{ type: 'string' }], additionalItems: { type: 'string' } };
      const newSchema: RJSFSchema = { type: 'array', items: [{ type: 'string' }] };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['a', 'b'])).toBeUndefined();
    });
    it('keeps the items of an array whose old items: false allowed none, and clears one whose new items: false does', () => {
      const closed: RJSFSchema = { type: 'array', items: false };
      const open: RJSFSchema = { type: 'array', items: true };
      expect(schemaUtils.sanitizeDataForNewSchema(open, closed, [1])).toStrictEqual([1]);
      expect(schemaUtils.sanitizeDataForNewSchema(closed, open, [1])).toBeUndefined();
    });
    it.each<[string, RJSFSchema]>([
      ['declares the array type', { type: 'array', items: false }],
      ['declares no type', { items: false }],
    ])('sanitizes against the new items an array whose old schema %s and items: false', (_, oldSchema) => {
      const newSchema: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a'] } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['a', 'b'])).toStrictEqual(['a']);
    });
    it('sanitizes a tuple item against the new tuple where the old one constrains nothing at its position', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: [true],
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: [{ type: 'string' }],
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1])).toEqual([1]);
    });
    it('returns undefined when one arrays has array items', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'number' },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: [{ type: 'string' }],
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1])).toBeUndefined();
    });
    it('returns undefined when the arrays has array items of different types', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'number' },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string' },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1])).toBeUndefined();
    });
    it('returns trimmed array when the new schema has maxItems < size for simple type', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string' },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        maxItems: 1,
        items: { type: 'string' },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['1', '2'])).toEqual(['1']);
    });
    it('filters out items not in the new items enum', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string', enum: ['c', 'd'] },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string', enum: ['a', 'b'] },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['c', 'd'])).toEqual([]);
    });
    it('still filters items when a nested if/then narrows the items enum for the current data (#5250)', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          obj: {
            type: 'object',
            properties: {
              sibling: { type: 'string', enum: ['x', 'y'] },
              list: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } },
            },
            if: { properties: { sibling: { const: 'x' } }, required: ['sibling'] },
            then: { properties: { list: { items: { enum: ['a'] } } } },
          },
        },
      };
      testValidator.setReturnValues({ isValid: [true] });
      // The user picks sibling 'x'; the same schema sanitizes against itself, but the `then` branch now applies
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, { obj: { sibling: 'x', list: ['a', 'b'] } })).toEqual(
        { obj: { sibling: 'x', list: ['a'] } },
      );
    });
    it('still filters a nested array inside an array-of-objects property the new schema introduces', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: { other: { type: 'string' } },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          other: { type: 'string' },
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: { tags: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } } },
            },
          },
        },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { rows: [{ tags: ['a', 'x'] }] })).toEqual({
        rows: [{ tags: ['a'] }],
      });
    });
    describe('an array property whose old schema declares no type', () => {
      const listOf = (list: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { list } });
      const stringList: RJSFSchema = { type: 'array', items: { type: 'string' } };
      const constList: RJSFSchema = { ...stringList, const: ['z'] };
      it('is sanitized against the new schema rather than cleared', () => {
        expect(schemaUtils.sanitizeDataForNewSchema(listOf(stringList), listOf({}), { list: ['a', 1] })).toEqual({
          list: ['a', 1],
        });
      });
      it('still has its items filtered by the new schema', () => {
        const enumList: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a'] } };
        expect(schemaUtils.sanitizeDataForNewSchema(listOf(enumList), listOf({}), { list: ['a', 'b'] })).toEqual({
          list: ['a'],
        });
      });
      it('is cleared when the new array const rejects it', () => {
        expect(schemaUtils.sanitizeDataForNewSchema(listOf(constList), listOf({}), { list: ['a'] })).toStrictEqual({});
      });
      it('is cleared, as a property new to the new schema, when the new array const rejects it', () => {
        const oldSchema: RJSFSchema = { type: 'object', properties: {} };
        expect(schemaUtils.sanitizeDataForNewSchema(listOf(constList), oldSchema, { list: ['a'] })).toStrictEqual({});
      });
      it('is kept when it equals the new array const', () => {
        expect(schemaUtils.sanitizeDataForNewSchema(listOf(constList), listOf({}), { list: ['z'] })).toEqual({
          list: ['z'],
        });
      });
      it('is still cleared when its old type was only guessed and the new schema declares items', () => {
        const guessed: RJSFMarkedSchema = { type: 'array', [GUESSED_TYPE_FLAG]: true };
        expect(
          schemaUtils.sanitizeDataForNewSchema(listOf(stringList), listOf(guessed), { list: ['a'] }),
        ).toStrictEqual({});
      });
      it('is kept when its old type was only guessed and the new schema declares additionalItems beside no tuple', () => {
        const guessed: RJSFMarkedSchema = { type: 'array', [GUESSED_TYPE_FLAG]: true };
        const newList = { type: 'array', additionalItems: { type: 'string' } } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(newList, guessed, [1])).toStrictEqual([1]);
        const tuple = { type: 'array', items: [{}], additionalItems: { type: 'string' } } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(tuple, guessed, [1])).toBeUndefined();
      });
      describe('holding inner arrays', () => {
        const constRows: RJSFSchema = { type: 'array', items: { type: 'array', const: [1] } };
        it('drops an inner array the new items const rejects', () => {
          expect(
            schemaUtils.sanitizeDataForNewSchema(listOf(constRows), listOf({}), { list: [[2], [1]] }),
          ).toStrictEqual({ list: [[1]] });
        });
        it('drops an inner array the new items const rejects, as a property new to the new schema', () => {
          const oldSchema: RJSFSchema = { type: 'object', properties: {} };
          expect(
            schemaUtils.sanitizeDataForNewSchema(listOf(constRows), oldSchema, { list: [[2], [1]] }),
          ).toStrictEqual({ list: [[1]] });
        });
        it('drops an inner array the new items const rejects, two levels down', () => {
          const deepRows: RJSFSchema = { type: 'array', items: { type: 'array', items: constRows.items } };
          expect(
            schemaUtils.sanitizeDataForNewSchema(listOf(deepRows), listOf({}), { list: [[[2], [1]]] }),
          ).toStrictEqual({ list: [[[1]]] });
        });
      });
      it('keeps a tuple the new schema declares', () => {
        const tuple: RJSFSchema = { type: 'array', items: [{ type: 'string' }, { type: 'number' }] };
        expect(schemaUtils.sanitizeDataForNewSchema(listOf(tuple), listOf({}), { list: ['a', 1] })).toStrictEqual({
          list: ['a', 1],
        });
      });
      it('keeps, rather than shifts, the items new prefixItems describe', () => {
        const prefixed = {
          type: 'array',
          prefixItems: [{ type: 'number' }],
          items: { type: 'string', enum: ['a'] },
        } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(prefixed, {}, [1, 'a'])).toStrictEqual([1, 'a']);
        expect(schemaUtils.sanitizeDataForNewSchema(listOf(prefixed), listOf({}), { list: [1, 'a'] })).toStrictEqual({
          list: [1, 'a'],
        });
      });
      it('is cleared where the new items: false rejects it', () => {
        const noItems = { type: 'array', items: false } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(noItems, {}, ['a'])).toBeUndefined();
        expect(schemaUtils.sanitizeDataForNewSchema(listOf(noItems), listOf({}), { list: ['a'] })).toStrictEqual({});
      });
      it('is cleared where the new additionalItems: false beside a tuple rejects it', () => {
        const pair = { type: 'array', items: [{ type: 'string' }], additionalItems: false } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(pair, {}, ['a', 'b'])).toBeUndefined();
      });
      it('gives an item that is not an object the new object const where it holds the old one', () => {
        const oldList: RJSFSchema = { type: 'array', items: { const: 'a' } };
        const newList: RJSFSchema = {
          type: 'array',
          items: { type: 'object', properties: { x: { type: 'string' } }, const: { x: 'b' } },
        };
        expect(schemaUtils.sanitizeDataForNewSchema(newList, oldList, ['a', 'c'])).toStrictEqual([{ x: 'b' }]);
      });
      it.each<[string, RJSFSchema]>([
        ['declares no type', {}],
        ['declares no items', { type: 'array' }],
        ['declares untyped items', { type: 'array', items: {} }],
      ])('drops the items that are not objects under new object items, where the old schema %s', (_, oldSchema) => {
        const objectList: RJSFSchema = {
          type: 'array',
          items: { type: 'object', properties: { x: { type: 'string' } } },
        };
        expect(schemaUtils.sanitizeDataForNewSchema(objectList, oldSchema, ['a', null, { x: 'b' }])).toStrictEqual([
          { x: 'b' },
        ]);
      });
      it('keeps a null item that nullable: true allows under object items', () => {
        const nullableObjectList: RJSFSchema = {
          type: 'array',
          items: { type: 'object', nullable: true, properties: { x: { type: 'string' } } },
        };
        expect(
          schemaUtils.sanitizeDataForNewSchema(nullableObjectList, nullableObjectList, [null, 'a', { x: 'b' }]),
        ).toStrictEqual([null, { x: 'b' }]);
      });
      it('keeps a null item that nullable: true allows under object items declaring no properties', () => {
        const nullableObjectList: RJSFSchema = { type: 'array', items: { type: 'object', nullable: true } };
        expect(
          schemaUtils.sanitizeDataForNewSchema(nullableObjectList, nullableObjectList, [null, 'a', { x: 'b' }]),
        ).toStrictEqual([null, { x: 'b' }]);
      });
      it('gives a nullable null item the new const where it holds the old one, and drops it otherwise', () => {
        const properties: RJSFSchema['properties'] = { x: { type: 'string' } };
        const arrayOf = (items: RJSFSchema): RJSFSchema => ({ type: 'array', items });
        const newList = arrayOf({ type: 'object', nullable: true, const: { x: 'a' }, properties });
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            newList,
            arrayOf({ type: 'object', nullable: true, const: null, properties }),
            [null],
          ),
        ).toStrictEqual([{ x: 'a' }]);
        expect(
          schemaUtils.sanitizeDataForNewSchema(newList, arrayOf({ type: 'object', nullable: true, properties }), [
            null,
          ]),
        ).toStrictEqual([]);
      });
      it('drops the items that are not objects under new object items, as a nullable list written with anyOf', () => {
        const nullableTags: RJSFSchema = { anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] };
        const objectTags: RJSFSchema = {
          type: 'array',
          items: { type: 'object', properties: { x: { type: 'string' } } },
        };
        expect(
          schemaUtils.sanitizeDataForNewSchema(listOf(objectTags), listOf(nullableTags), { list: ['a', 'b'] }),
        ).toStrictEqual({ list: [] });
      });
      it('is sanitized against the new schema even where the old schema declares items', () => {
        const enumList: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a'] } };
        expect(
          schemaUtils.sanitizeDataForNewSchema(listOf(enumList), listOf({ items: { type: 'number' } }), {
            list: ['a', 'b'],
          }),
        ).toStrictEqual({ list: ['a'] });
        expect(
          schemaUtils.sanitizeDataForNewSchema(listOf(enumList), listOf({ items: [{ type: 'string' }] }), {
            list: ['a', 'b'],
          }),
        ).toStrictEqual({ list: ['a'] });
      });
      it('has the keys only its declared object items declare removed', () => {
        const oldList: RJSFSchema = { items: { type: 'object', properties: { a: {} } } };
        const newList: RJSFSchema = { type: 'array', items: { type: 'object', properties: { b: {} } } };
        expect(schemaUtils.sanitizeDataForNewSchema(newList, oldList, [{ a: 'x', b: 'y' }])).toStrictEqual([
          { b: 'y' },
        ]);
      });
      it('is sanitized against the new schema when sanitized directly', () => {
        const enumList: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a'] } };
        expect(schemaUtils.sanitizeDataForNewSchema(enumList, {}, ['a', 'b'])).toStrictEqual(['a']);
      });
    });
    it('keeps items that remain valid in the new items enum', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string', enum: ['a', 'b', 'c'] },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string', enum: ['a', 'b'] },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['a', 'c'])).toEqual(['a']);
    });
    it('returns all items when the new items schema has no enum constraint', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string', enum: ['a', 'b'] },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string' },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['a', 'b'])).toEqual(['a', 'b']);
    });
    it('filters out object items a narrowed items enum rejects, like scalar items (#5346)', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', enum: [{ id: 'a' }, { id: 'b' }], properties: { id: { type: 'string' } } },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', enum: [{ id: 'a' }], properties: { id: { type: 'string' } } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ id: 'a' }, { id: 'b' }])).toEqual([
        { id: 'a' },
      ]);
    });
    it('filters out object items a narrowed items oneOf of constants rejects (#5346)', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', oneOf: [{ const: { id: 'a' } }, { const: { id: 'b' } }] },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', oneOf: [{ const: { id: 'a' } }] },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ id: 'a' }, { id: 'b' }])).toEqual([
        { id: 'a' },
      ]);
    });
    it('sanitizes object items per property when they are not picked as a whole', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { id: { type: 'string' }, extra: { type: 'string' } } },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { id: { type: 'string' } } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ id: 'a', extra: 'x' }])).toEqual([
        { id: 'a' },
      ]);
    });
    it('keeps the object items of an items schema declaring no properties, dropping any that is not an object (#5736)', () => {
      const schema: RJSFSchema = { type: 'array', items: { type: 'object' } };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [{ k: 1 }, 'x'])).toEqual([{ k: 1 }]);
    });
    it('keeps a free-form object list inside items resolved through an if/then (#5736)', () => {
      const rows: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, tags: { type: 'array', items: { type: 'object' } } },
          if: { properties: { name: { const: 'x' } } },
          then: {},
        },
      };
      const schema: RJSFSchema = { type: 'object', properties: { rows } };
      const formData = { rows: [{ name: 'a', tags: [{ k: 1 }] }] };
      const retrieved = schemaUtils.retrieveSchema(schema, formData);
      expect(schemaUtils.sanitizeDataForNewSchema(retrieved, retrieved, formData)).toEqual(formData);
    });
    it('filters out object items a multi-value enum option rejects, like scalar items (#5440)', () => {
      const objectSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', oneOf: [{ enum: [{ id: 'a' }, { id: 'b' }] }] },
      };
      const stringSchema: RJSFSchema = { type: 'array', items: { type: 'string', oneOf: [{ enum: ['a', 'b'] }] } };
      expect(schemaUtils.sanitizeDataForNewSchema(objectSchema, objectSchema, [{ id: 'a' }, { id: 'c' }])).toEqual([
        { id: 'a' },
      ]);
      expect(schemaUtils.sanitizeDataForNewSchema(stringSchema, stringSchema, ['a', 'c'])).toEqual(['a']);
    });
    it('filters out object items a multi-value enum option rejects when the items declare properties (#5440)', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' } },
          oneOf: [{ enum: [{ id: 'a' }, { id: 'b' }] }],
        },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [{ id: 'a' }, { id: 'c' }])).toEqual([{ id: 'a' }]);
    });
    it('sanitizes the array items of an array per element, as it does an array property (#5440)', () => {
      const items = (...keys: string[]): RJSFSchema => ({
        type: 'array',
        items: { type: 'object', properties: Object.fromEntries(keys.map((key) => [key, { type: 'string' }])) },
      });
      const oldSchema: RJSFSchema = { type: 'array', items: items('a', 'b') };
      const newSchema: RJSFSchema = { type: 'array', items: items('a') };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [[{ a: '1', b: '2' }], 'x'])).toEqual([
        [{ a: '1' }],
        'x',
      ]);
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          { type: 'object', properties: { list: items('a') } },
          { type: 'object', properties: { list: items('a', 'b') } },
          { list: [{ a: '1', b: '2' }] },
        ),
      ).toEqual({ list: [{ a: '1' }] });
    });
    it('filters out array items a multi-value enum option rejects, as it does object items (#5440)', () => {
      const schema: RJSFSchema = { type: 'array', items: { type: 'array', oneOf: [{ enum: [['a'], ['b']] }] } };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [['a'], ['c']])).toEqual([['a']]);
    });
    it('keeps an array item whose items the new schema describes differently, as before (#5440)', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: { type: 'array', items: { type: 'string' } } };
      const row = (items?: RJSFSchema): RJSFSchema => ({ type: 'array', ...(items && { items }) });
      [row({ type: 'number' }), row({ type: ['string', 'null'] }), row({}), row()].forEach((newItems) => {
        expect(schemaUtils.sanitizeDataForNewSchema({ type: 'array', items: newItems }, oldSchema, [['1']])).toEqual([
          ['1'],
        ]);
      });
    });
    it('keeps an object item its enum option lists as it is, rather than filling its absent object properties', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' }, opt: { type: 'object', properties: { x: { type: 'string' } } } },
          oneOf: [{ enum: [{ id: 'a' }, { id: 'b' }] }],
        },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [{ id: 'a' }])).toEqual([{ id: 'a' }]);
    });
    it('filters out an item of array items that is not an array when the options do not list it', () => {
      const schema: RJSFSchema = { type: 'array', items: { type: 'array', oneOf: [{ enum: [['a'], ['b']] }] } };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [['a'], 'junk'])).toEqual([['a']]);
    });
    it('filters out array items a new array const rejects, unless the old items declared the same const', () => {
      const items: RJSFSchema = { type: 'array', items: { type: 'string' } };
      const newSchema: RJSFSchema = { type: 'array', items: { ...items, const: ['x'] } };
      const data = [['x'], ['c']];
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, { type: 'array', items }, data)).toEqual([['x']]);
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, newSchema, data)).toEqual(data);
    });
    it('filters out a scalar item a scalar const rejects, even where the old items declared the same const', () => {
      const items = (extra: RJSFSchema): RJSFSchema => ({ type: 'array', items: { const: 'a', ...extra } });
      expect(schemaUtils.sanitizeDataForNewSchema(items({ type: 'string' }), items({}), ['b', 'a'])).toStrictEqual([
        'a',
      ]);
      const prefixed = (extra: RJSFSchema): RJSFSchema => ({
        type: 'array',
        prefixItems: [{ const: 'a', ...extra }],
        items: { type: 'string' },
      });
      expect(
        schemaUtils.sanitizeDataForNewSchema(prefixed({ type: 'string' }), prefixed({}), ['b', 'c']),
      ).toBeUndefined();
    });
    it('filters out an object or array item a new scalar const rejects, as it does a scalar one', () => {
      const newSchema: RJSFSchema = { type: 'array', items: { const: 'x' } };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, { type: 'array', items: {} }, [{ a: 1 }, ['x'], 'y', 'x']),
      ).toStrictEqual(['x']);
    });
    it('filters out an item that is not an array that a new array const rejects, a null its type list allows included', () => {
      const items: RJSFSchema = { type: ['array', 'null'], items: { type: 'string' } };
      const newSchema: RJSFSchema = { type: 'array', items: { ...items, const: ['x'] } };
      const data = [['x'], 'junk', null];
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, { type: 'array', items }, data)).toStrictEqual([['x']]);
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, newSchema, data)).toStrictEqual(data);
    });
    it('keeps an array item equal to its items const as it is, rather than filling its absent object properties', () => {
      const items: RJSFSchema = {
        type: 'array',
        const: [{ k: 'a' }],
        items: {
          type: 'object',
          properties: { k: { type: 'string' }, opt: { type: 'object', properties: { x: { type: 'string' } } } },
        },
      };
      const schema: RJSFSchema = { type: 'array', items };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [[{ k: 'a' }]])).toEqual([[{ k: 'a' }]]);
    });
    describe('an array whose old schema declares its type but no items', () => {
      const enumList: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a'] } };
      it.each<[string, RJSFSchema]>([
        ['no items', { type: 'array' }],
        ['items: true', { type: 'array', items: true }],
      ])('is sanitized against the new items rather than cleared, where the old schema declares %s', (_, oldSchema) => {
        expect(schemaUtils.sanitizeDataForNewSchema(enumList, oldSchema, ['a', 'b'])).toStrictEqual(['a']);
        const listOf = (list: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { list } });
        expect(
          schemaUtils.sanitizeDataForNewSchema(listOf(enumList), listOf(oldSchema), { list: ['a', 'b'] }),
        ).toStrictEqual({ list: ['a'] });
      });
      it('drops an inner array the new items const rejects', () => {
        const constRows: RJSFSchema = { type: 'array', items: { type: 'array', const: [1] } };
        expect(schemaUtils.sanitizeDataForNewSchema(constRows, { type: 'array' }, [[2], [1]])).toStrictEqual([[1]]);
      });
      it('is sanitized against a new tuple position by position', () => {
        const tuple: RJSFSchema = { type: 'array', items: [{ type: 'string' }, { type: 'number' }] };
        expect(schemaUtils.sanitizeDataForNewSchema(tuple, { type: 'array' }, [1, 'a'])).toStrictEqual([1, 'a']);
      });
      it('is still cleared against new items where the old schema declares prefixItems', () => {
        const prefixed = { type: 'array', prefixItems: [{ type: 'number' }] } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(enumList, prefixed, ['a'])).toBeUndefined();
      });
      it('is sanitized against new prefixItems position by position, rather than shifting the items they describe', () => {
        const prefixed = { ...enumList, prefixItems: [{ type: 'string' }] } as RJSFSchema;
        expect(schemaUtils.sanitizeDataForNewSchema(prefixed, { type: 'array' }, ['x', 'b', 'a'])).toStrictEqual([
          'x',
          'a',
        ]);
      });
      it('is kept where the new schema declares items: true', () => {
        expect(schemaUtils.sanitizeDataForNewSchema({ type: 'array', items: true }, { type: 'array' }, [1, 2])).toEqual(
          [1, 2],
        );
      });
    });
    describe('a null under an object schema', () => {
      const objectWith = (p: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { p } });
      const required: RJSFSchema = { type: 'object', required: ['x'], properties: { x: { type: 'string' } } };
      it('is removed rather than given an empty object, so the defaults decide as on mount', () => {
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(required), objectWith(required), { p: null }),
        ).toStrictEqual({});
      });
      it('is removed where the new schema declares an object const', () => {
        const constObject: RJSFSchema = { type: 'object', const: { a: 2 }, properties: { a: { type: 'number' } } };
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(constObject), objectWith({}), { p: null }),
        ).toStrictEqual({});
      });
      it('takes the new const where it is the old const', () => {
        const constObject: RJSFSchema = { type: 'object', const: { a: 2 }, properties: { a: { type: 'number' } } };
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(constObject), objectWith({ const: null }), { p: null }),
        ).toStrictEqual({ p: { a: 2 } });
      });
      it('is removed where the object schema declares no properties', () => {
        const bare: RJSFSchema = { type: 'object' };
        expect(schemaUtils.sanitizeDataForNewSchema(objectWith(bare), objectWith(bare), { p: null })).toStrictEqual({});
      });
      it('is kept where the type list allows null', () => {
        const nullable: RJSFSchema = { ...required, type: ['object', 'null'] };
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(nullable), objectWith(nullable), { p: null }),
        ).toStrictEqual({ p: null });
      });
      it('is kept where the object schema is nullable', () => {
        const nullable: RJSFSchema = { ...required, nullable: true };
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(nullable), objectWith(nullable), { p: null }),
        ).toStrictEqual({ p: null });
      });
    });
    describe('a value of another type under a new object const', () => {
      const objectWith = (p: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { p } });
      it.each<[string, unknown]>([
        ['a string', 'x'],
        ['an array', [1]],
      ])('is cleared rather than given an empty object the const rejects, for %s', (_, value) => {
        const constObject: RJSFSchema = { type: 'object', const: { a: 2 }, properties: { a: { type: 'number' } } };
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(constObject), objectWith({}), { p: value }),
        ).toStrictEqual({});
      });
      it('gets an empty object the const accepts', () => {
        const emptyConst: RJSFSchema = { type: 'object', const: {}, properties: { a: { type: 'number' } } };
        expect(schemaUtils.sanitizeDataForNewSchema(objectWith(emptyConst), objectWith({}), { p: 'x' })).toStrictEqual({
          p: {},
        });
      });
      it('is cleared where the object schema declares no properties', () => {
        const constObject: RJSFSchema = { type: 'object', const: { a: 2 } };
        expect(schemaUtils.sanitizeDataForNewSchema(objectWith(constObject), objectWith({}), { p: 'x' })).toStrictEqual(
          {},
        );
      });
    });
    describe('an object the new const rejects', () => {
      const constObject = (a: number): RJSFSchema => ({
        type: 'object',
        const: { a },
        properties: { a: { type: 'number' } },
      });
      const objectWith = (o: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { o } });
      it('takes the new const as a property where it holds the old one', () => {
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(constObject(2)), objectWith(constObject(1)), { o: { a: 1 } }),
        ).toStrictEqual({ o: { a: 2 } });
      });
      it('is cleared as a property where it holds neither const', () => {
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(constObject(2)), objectWith(constObject(1)), { o: { a: 3 } }),
        ).toStrictEqual({});
      });
      it('takes the new const when sanitized directly where it holds the old one, and is cleared otherwise', () => {
        expect(schemaUtils.sanitizeDataForNewSchema(constObject(2), constObject(1), { a: 1 })).toStrictEqual({ a: 2 });
        expect(schemaUtils.sanitizeDataForNewSchema(constObject(2), constObject(1), { a: 3 })).toBeUndefined();
      });
      it('takes the new const as an array item where it holds the old one, and is dropped otherwise', () => {
        const items = (a: number): RJSFSchema => ({ type: 'array', items: constObject(a) });
        expect(schemaUtils.sanitizeDataForNewSchema(items(2), items(1), [{ a: 1 }, { a: 3 }])).toStrictEqual([
          { a: 2 },
        ]);
      });
      it('is kept where removing what only the old schema declares leaves it equal to the new const', () => {
        const oldObject: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'number' }, b: { type: 'string' } },
        };
        const data = { a: 2, b: 'x' };
        expect(schemaUtils.sanitizeDataForNewSchema(constObject(2), oldObject, data)).toStrictEqual({ a: 2 });
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(constObject(2)), objectWith(oldObject), { o: data }),
        ).toStrictEqual({ o: { a: 2 } });
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            { type: 'array', items: constObject(2) },
            { type: 'array', items: oldObject },
            [data],
          ),
        ).toStrictEqual([{ a: 2 }]);
      });
      it('drops an array item of another type rather than giving it an empty object the const rejects', () => {
        const items = (a: number): RJSFSchema => ({ type: 'array', items: constObject(a) });
        expect(schemaUtils.sanitizeDataForNewSchema(items(2), items(1), [[1], { a: 2 }])).toStrictEqual([{ a: 2 }]);
        expect(schemaUtils.sanitizeDataForNewSchema(constObject(2), constObject(1), [1])).toBeUndefined();
      });
      it('takes the new const when sanitized directly where the schema declares no properties', () => {
        const bare = (a: number): RJSFSchema => ({ type: 'object', const: { a } });
        expect(schemaUtils.sanitizeDataForNewSchema(bare(2), bare(1), { a: 1 })).toStrictEqual({ a: 2 });
        expect(schemaUtils.sanitizeDataForNewSchema(bare(2), bare(1), { a: 3 })).toBeUndefined();
      });
      it.each<[string, RJSFSchema, RJSFSchema, unknown[], unknown[]]>([
        [
          'object items declaring no properties',
          { type: 'object', const: { a: 1 } },
          { type: 'object', const: { a: 2 } },
          [{ a: 1 }, { a: 3 }],
          [{ a: 2 }],
        ],
        ['string items', { type: 'string', const: 'x' }, { type: 'string', const: 'y' }, ['x', 'z'], ['y']],
        ['items declaring no type', { const: { a: 1 } }, { const: { a: 2 } }, [{ a: 1 }], [{ a: 2 }]],
      ])(
        'takes the new const as an item of %s where it holds the old one, and is dropped otherwise',
        (_, oldItems, newItems, data, expected) => {
          expect(
            schemaUtils.sanitizeDataForNewSchema(
              { type: 'array', items: newItems },
              { type: 'array', items: oldItems },
              data,
            ),
          ).toStrictEqual(expected);
        },
      );
      it('takes a copy of the new const, shared with neither the schema nor another item', () => {
        const newItems = constObject(2);
        const sanitized = schemaUtils.sanitizeDataForNewSchema(
          { type: 'array', items: newItems },
          { type: 'array', items: constObject(1) },
          [{ a: 1 }, { a: 1 }],
        ) as unknown[];
        expect(sanitized).toStrictEqual([{ a: 2 }, { a: 2 }]);
        expect(sanitized[0]).not.toBe(newItems.const);
        expect(sanitized[0]).not.toBe(sanitized[1]);
      });
      it('takes the new const as a property where it holds the const of an untyped old schema', () => {
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(constObject(2)), objectWith({ const: 'x' }), { o: 'x' }),
        ).toStrictEqual({ o: { a: 2 } });
      });
      it('takes the new const as an inner array where it holds the old one, and is dropped otherwise', () => {
        const rows = (a: number): RJSFSchema => ({
          type: 'array',
          items: { type: 'array', const: [a], items: { type: 'number' } },
        });
        expect(schemaUtils.sanitizeDataForNewSchema(rows(2), rows(1), [[1], [3]])).toStrictEqual([[2]]);
      });
      it('is kept when the old schema declared the same const, for validation to report', () => {
        const old: RJSFSchema = { ...constObject(2), title: 'Old' };
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(constObject(2)), objectWith(old), { o: { a: 1 } }),
        ).toStrictEqual({ o: { a: 1 } });
      });
      it('reads a $data-shaped const of an object schema as the value, as constIsAjvDataReference() does', () => {
        const dataConst: RJSFSchema = { ...constObject(2), const: { $data: '1/other' } };
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(dataConst), objectWith(constObject(1)), { o: { a: 1 } }),
        ).toStrictEqual({ o: { $data: '1/other' } });
      });
    });
    describe('a value the new schema rejects under a property', () => {
      const objectWith = (k: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { k } });
      it.each<[string, RJSFSchema, RJSFSchema, unknown]>([
        [
          'an object const',
          { type: 'object', properties: { a: { type: 'number' } } },
          { type: 'object', const: { a: 1 }, properties: { a: { type: 'number' } } },
          { a: 2 },
        ],
        ['a scalar const', { type: 'string' }, { type: 'string', const: 'x' }, 'y'],
        ['an enum', { type: 'string' }, { type: 'string', enum: ['a', 'b'] }, 'z'],
        ['a readOnly default', { type: 'string', default: 'o' }, { type: 'string', default: 'n', readOnly: true }, 'u'],
        [
          'items of another type',
          { type: 'array', items: { type: 'number' } },
          { type: 'array', items: { type: 'string' } },
          [1],
        ],
      ])('is removed, for the defaults to fill, where it is rejected by %s', (_, oldK, newK, value) => {
        expect(schemaUtils.sanitizeDataForNewSchema(objectWith(newK), objectWith(oldK), { k: value })).toStrictEqual(
          {},
        );
      });
      it.each<[string, RJSFSchema, RJSFSchema]>([
        ['a type', { const: 'x' }, { type: 'string', const: 'x' }],
        ['a const', { type: 'string' }, { type: 'string', const: 'x' }],
        ['a default', { type: 'string', const: 'x', default: 'o' }, { type: 'string', const: 'x', default: 'n' }],
        ['an enum', { type: 'string', enum: ['a', 'b'] }, { type: 'string', enum: ['c', 'd'] }],
        ['a default nothing rejects it by', { type: 'string', default: 'a' }, { type: 'string', default: 'b' }],
        [
          'a maxItems',
          { type: 'array', items: { type: 'string' }, maxItems: 2 },
          { type: 'array', items: { type: 'string' }, maxItems: 3 },
        ],
        [
          'the default of an array',
          { type: 'array', items: { type: 'string' } },
          { type: 'array', items: { type: 'string' }, default: ['x'] },
        ],
      ])('is removed where the data holds it as undefined and the new schema changes %s', (_, oldK, newK) => {
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(newK), objectWith(oldK), { k: undefined }),
        ).toStrictEqual({});
      });
      it.each<[string, RJSFSchema, RJSFSchema]>([
        ['const', { type: 'string', const: 'x' }, { type: 'string', const: 'x' }],
        [
          'readOnly default',
          { type: 'string', default: 'n', readOnly: true },
          { type: 'string', default: 'n', readOnly: true },
        ],
        ['enum', { type: 'string', enum: ['a', 'b'] }, { type: 'string', enum: ['a', 'b'] }],
        [
          'enum holding its default',
          { type: 'string', enum: ['a', 'b'], default: 'a' },
          { type: 'string', enum: ['a', 'b'], default: 'a' },
        ],
        ['single-value enum', { type: 'string', enum: ['a'] }, { type: 'string', enum: ['a'] }],
        ['default made readOnly', { type: 'string', default: 'n' }, { type: 'string', default: 'n', readOnly: true }],
      ])('stays held as undefined where the same %s rejects it on both sides', (_, oldK, newK) => {
        expect(
          schemaUtils.sanitizeDataForNewSchema(objectWith(newK), objectWith(oldK), { k: undefined }),
        ).toStrictEqual({ k: undefined });
      });
      it('is replaced where the data holds it as undefined and the new enum offers one value', () => {
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            objectWith({ type: 'string', enum: ['c'] }),
            objectWith({ type: 'string', enum: ['a', 'b'] }),
            { k: undefined },
          ),
        ).toStrictEqual({ k: 'c' });
      });
      it.each<[string, string, unknown]>([
        ['is removed', 'b', {}],
        ['stays held as undefined', 'a', { k: undefined }],
      ])(
        '%s where the data holds it as undefined and the parent default for it goes from a to %s',
        (_, newDefault, expected) => {
          const withDefault = (k: string): RJSFSchema => ({
            type: 'object',
            default: { k },
            properties: { k: { type: 'string', enum: ['a', 'b'] } },
          });
          expect(
            schemaUtils.sanitizeDataForNewSchema(withDefault(newDefault), withDefault('a'), { k: undefined }),
          ).toStrictEqual(expected);
        },
      );
      it('stays held as undefined where the old parent default for a key it declares nothing for is the new default', () => {
        const oldSchema: RJSFSchema = { type: 'object', default: { k: 'd' } };
        const newSchema: RJSFSchema = { type: 'object', properties: { k: { default: 'd' } } };
        expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { k: undefined })).toStrictEqual({
          k: undefined,
        });
      });
      it('stays left out where the data holds none', () => {
        const constK: RJSFSchema = { type: 'string', const: 'x' };
        expect(schemaUtils.sanitizeDataForNewSchema(objectWith(constK), objectWith({}), {})).toStrictEqual({});
      });
    });
    describe('an object equal to its const', () => {
      const withDefault = (properties: RJSFSchema['properties']): RJSFSchema => ({
        type: 'object',
        const: { a: 1 },
        properties: { a: { type: 'number' }, ...properties },
      });
      it('is kept as it is when sanitized directly, rather than given a default the new schema adds', () => {
        const newSchema = withDefault({ b: { type: 'number', default: 2 } });
        expect(schemaUtils.sanitizeDataForNewSchema(newSchema, withDefault({}), { a: 1 })).toStrictEqual({ a: 1 });
      });
      it('is kept as it is as a property', () => {
        const objectWith = (o: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { o } });
        const newSchema = objectWith(withDefault({ b: { type: 'number', default: 2 } }));
        expect(
          schemaUtils.sanitizeDataForNewSchema(newSchema, objectWith(withDefault({})), { o: { a: 1 } }),
        ).toStrictEqual({ o: { a: 1 } });
      });
    });
    describe('an array equal to its const', () => {
      const items: RJSFSchema = {
        type: 'object',
        properties: { k: { type: 'string' }, opt: { type: 'object', properties: { x: { type: 'string' } } } },
      };
      const grid: RJSFSchema = { type: 'array', const: [{ k: 'a' }], items };
      it('is kept as it is when sanitized directly', () => {
        expect(schemaUtils.sanitizeDataForNewSchema(grid, grid, [{ k: 'a' }])).toEqual([{ k: 'a' }]);
      });
      it('is kept as it is as a property', () => {
        const schema: RJSFSchema = { type: 'object', properties: { grid } };
        expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, { grid: [{ k: 'a' }] })).toEqual({
          grid: [{ k: 'a' }],
        });
      });
      it('is kept as it is when the new items add a property with a default', () => {
        const newSchema: RJSFSchema = {
          ...grid,
          items: { ...items, properties: { ...items.properties, d: { type: 'string', default: 'z' } } },
        };
        expect(schemaUtils.sanitizeDataForNewSchema(newSchema, grid, [{ k: 'a' }])).toEqual([{ k: 'a' }]);
      });
    });
    it('sanitizes an undefined object item whose items declare no const, rather than dropping it', () => {
      const schema: RJSFSchema = { type: 'array', items: { type: 'object', properties: { k: { type: 'string' } } } };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [undefined, { k: 'a' }])).toEqual([{}, { k: 'a' }]);
    });
    it('filters out array items a new array const rejects where the old items declare no type', () => {
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'array', items: { type: 'string' }, const: ['x'] },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, { type: 'array', items: {} }, [['x'], ['c']])).toEqual([
        ['x'],
      ]);
    });
    it('checks an item of array items that is not an array against the options its own value resolves', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: { type: ['array', 'null'], if: { type: 'array' }, then: { oneOf: [{ enum: [['a'], ['b']] }] } },
      };
      // The whole array and its `['a']` meet the `if`, and the `null` does not, so no options apply to it
      testValidator.setReturnValues({ isValid: [true, true, false] });
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [['a'], null])).toEqual([['a'], null]);
    });
    it('keeps the array items the new schema describes where the old items declare no type (#5440)', () => {
      const newSchema: RJSFSchema = { type: 'array', items: { type: 'array', items: { type: 'string' } } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, { type: 'array', items: {} }, [['a'], ['b', 1]])).toEqual([
        ['a'],
        ['b', 1],
      ]);
    });
    it('sanitizes the object items of a type list naming object per property, keeping a null it allows', () => {
      const items = (extra: string): RJSFSchema => ({
        type: ['object', 'null'],
        properties: { id: { type: 'string' }, [extra]: { type: 'string' } },
      });
      const oldSchema: RJSFSchema = { type: 'array', items: items('extra') };
      const newSchema: RJSFSchema = { type: 'array', items: items('other') };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ id: 'a', extra: 'x' }, null])).toEqual([
        { id: 'a' },
        null,
      ]);
    });
    it('keeps the items of an items schema naming no type as they are, rather than guessing an object from them', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: { properties: { id: { type: 'string' } } } };
      const newSchema: RJSFSchema = { type: 'array', items: { properties: { other: { type: 'string' } } } };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ id: 'a' }])).toEqual([{ id: 'a' }]);
    });
    it('trims object items picked as a whole to maxItems (#5346)', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', enum: [{ id: 'a' }, { id: 'b' }] },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        maxItems: 1,
        items: { type: 'object', enum: [{ id: 'a' }, { id: 'b' }] },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ id: 'a' }, { id: 'b' }])).toEqual([
        { id: 'a' },
      ]);
    });
    it('allows no item at all for maxItems of 0, whether or not the items are picked as a whole (#5346)', () => {
      const scalarItems: RJSFSchema = { type: 'array', maxItems: 0, items: { type: 'string' } };
      expect(
        schemaUtils.sanitizeDataForNewSchema(scalarItems, { type: 'array', items: { type: 'string' } }, ['a']),
      ).toEqual([]);
      const selectItems: RJSFSchema = { type: 'array', maxItems: 0, items: { type: 'object', enum: [{ id: 'a' }] } };
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          selectItems,
          { type: 'array', items: { type: 'object', enum: [{ id: 'a' }] } },
          [{ id: 'a' }],
        ),
      ).toEqual([]);
      const containerItems: RJSFSchema = {
        type: 'array',
        maxItems: 0,
        items: { type: 'object', properties: { id: { type: 'string' } } },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          containerItems,
          { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } } } },
          [{ id: 'a' }],
        ),
      ).toEqual([]);
    });
    it('offers no constraint for an empty items enum, like an empty oneOf (#5346)', () => {
      const emptyEnum: RJSFSchema = { type: 'array', items: { type: 'string', enum: [] } };
      expect(schemaUtils.sanitizeDataForNewSchema(emptyEnum, emptyEnum, ['a'])).toEqual(['a']);
      const emptyOneOf: RJSFSchema = { type: 'array', items: { type: 'string', oneOf: [] } };
      expect(schemaUtils.sanitizeDataForNewSchema(emptyOneOf, emptyOneOf, ['a'])).toEqual(['a']);
      const emptyEnumObject: RJSFSchema = {
        type: 'array',
        items: { type: 'object', enum: [], properties: { id: { type: 'string' } } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(emptyEnumObject, emptyEnumObject, [{ id: 'a' }])).toEqual([
        { id: 'a' },
      ]);
    });
    it('leaves an empty items enum beside a list of object constants to that list (#5346)', () => {
      const items: RJSFSchema = { type: 'object', enum: [], oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] };
      const schema: RJSFSchema = { type: 'array', items };
      expect(schemaUtils.sanitizeDataForNewSchema(schema, schema, [{ a: 1 }, { c: 3 }])).toEqual([{ a: 1 }]);
    });
    it('returns whole array when the new schema does not have maxItems for simple type', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          string_def: {
            type: 'string',
          },
        },
      };
      const oldSchema: RJSFSchema = {
        type: 'array',
        maxItems: 2,
        items: { $ref: '#/definitions/string_def' },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { $ref: '#/definitions/string_def' },
      };
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, rootSchema, newSchema, oldSchema, ['1', '2']),
      ).toEqual(['1', '2']);
    });
    it('returns trimmed array when the new schema has maxItems < size for object type', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { foo: { type: 'string' } } },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        maxItems: 1,
        items: { type: 'object', properties: { foo: { type: 'string' } } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ foo: '1' }, { foo: '2' }])).toEqual([
        { foo: '1' },
      ]);
    });
    it('returns whole array when the new schema does not have maxItems for object type', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        maxItems: 2,
        items: { type: 'object', properties: { foo: { type: 'string' } } },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { foo: { type: 'string' } } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ foo: '1' }, { foo: '2' }])).toEqual([
        { foo: '1' },
        { foo: '2' },
      ]);
    });
    it('returns undefined object values when the new schema has different object type', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { foo: { type: 'string' } } },
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'object', properties: { foo: { type: 'number' } } },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [{ foo: '1' }, { foo: '2' }])).toEqual([
        { foo: undefined },
        { foo: undefined },
      ]);
    });
    it('returns undefined object values when the new schema has array with different object types', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'array', items: { type: 'string' } } },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'array', items: { type: 'number' } } },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {
          foo: ['1'],
        }),
      ).toEqual({ foo: undefined });
    });
    it('keeps an array constant picked by a select that both schemas share', () => {
      const sizes: RJSFSchema = { type: 'array', oneOf: [{ const: [1, 2] }, { const: [3] }] };
      const oldSchema: RJSFSchema = { type: 'object', properties: { kind: { const: 'a' }, sizes } };
      const newSchema: RJSFSchema = { type: 'object', properties: { kind: { const: 'b' }, sizes } };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { kind: 'a', sizes: [1, 2] })).toEqual({
        kind: 'b',
        sizes: [1, 2],
      });
    });
    it('clears an object constant the new select does not offer', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: { pick: { type: 'object', oneOf: [{ const: { x: 1 } }, { const: { x: 2 } }] } },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { pick: { type: 'object', oneOf: [{ const: { y: 1 } }, { const: { y: 2 } }] } },
      };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { pick: { x: 1 } })).toEqual({
        pick: undefined,
      });
    });
    it('keeps a read-only object select holding its default, compared by value', () => {
      const sel: RJSFSchema = { type: 'object', readOnly: true, default: { a: 1 }, enum: [{ a: 1 }, { a: 2 }] };
      const oldSchema: RJSFSchema = { type: 'object', properties: { k: { const: 'a' }, sel } };
      const newSchema: RJSFSchema = { type: 'object', properties: { k: { const: 'b' }, sel } };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { k: 'a', sel: { a: 1 } })).toEqual({
        k: 'b',
        sel: { a: 1 },
      });
    });
    it('replaces an untouched object default with the new default, compared by value', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: { sel: { type: 'object', default: { a: 1 }, enum: [{ a: 1 }, { a: 2 }] } },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { sel: { type: 'object', default: { a: 2 }, enum: [{ a: 1 }, { a: 2 }] } },
      };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { sel: { a: 1 } })).toEqual({
        sel: { a: 2 },
      });
    });
    it.each<[string, RJSFSchema]>([
      ['an enum', { type: 'object', enum: [{ a: 1 }, { a: 2 }] }],
      ['a oneOf of constants', { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] }],
    ])('keeps array items picked from object constants spelled as %s', (_, items) => {
      const tags: RJSFSchema = { type: 'array', uniqueItems: true, items };
      const oldSchema: RJSFSchema = { type: 'object', properties: { k: { const: 'a' }, tags } };
      const newSchema: RJSFSchema = { type: 'object', properties: { k: { const: 'b' }, tags } };

      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { k: 'a', tags: [{ a: 1 }, { a: 3 }] }),
      ).toEqual({ k: 'b', tags: [{ a: 1 }] });
    });
    it('returns formData when the new schema has field that is not in the old schema', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {},
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'object' } },
      };
      const formData = { foo: '1' };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, formData)).toEqual(formData);
    });
    it('returns empty object when the old schema is of type string and the new contains "property" field', () => {
      const oldSchema: RJSFSchema = { type: 'string' };
      const newSchema: RJSFSchema = {
        properties: {
          foo: {
            type: 'string',
          },
        },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, 'qwerty')).toEqual({});
    });
    it('returns empty object when the old schema is of type array and the new contains "property" field', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const newSchema: RJSFSchema = {
        properties: {
          foo: {
            type: 'string',
          },
        },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, ['qwerty', 'asdfg'])).toEqual({});
    });
    it('always filters enum values when no previous data is passed, the way direct callers behave on v7', () => {
      // The formDataForNewOption path: switching between oneOf options that share an enum items schema
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          one: { type: 'string', enum: ['a', 'b'] },
          list: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          one: { type: 'string', enum: ['a', 'b'] },
          list: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { one: 'legacy', list: ['a', 'legacy'] }),
      ).toEqual({ list: ['a'] });
    });
    it('keeps a value a select over object constants written as $refs still offers, as a property and as an item', () => {
      const definitions: RJSFSchema['definitions'] = { A: { const: { k: 'a' } }, B: { const: { k: 'b' } } };
      const pick: RJSFSchema = { type: 'object', oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] };
      const oldSchema: RJSFSchema = {
        definitions,
        type: 'object',
        properties: { pick, list: { type: 'array', items: pick }, other: { type: 'string' } },
      };
      const newSchema: RJSFSchema = {
        ...oldSchema,
        properties: { ...oldSchema.properties, other: { type: 'number' } },
      };
      const data = { pick: { k: 'b' }, list: [{ k: 'a' }, { k: 'c' }], other: 'x' };
      expect(sanitizeDataForNewSchema({ validator: testValidator }, newSchema, newSchema, oldSchema, data)).toEqual({
        pick: { k: 'b' },
        list: [{ k: 'a' }],
      });
    });
    describe('a select over whole arrays', () => {
      const definitions: RJSFSchema['definitions'] = { a: { const: [1, 2] }, b: { const: [3] } };
      const sanitize = (newSchema: RJSFSchema, oldSchema: RJSFSchema, data: unknown) =>
        sanitizeDataForNewSchema({ validator: testValidator }, newSchema, newSchema, oldSchema, data);
      const unlisted: RJSFSchema = { type: 'array' };
      it.each<[string, RJSFSchema]>([
        [
          'written as $refs',
          { definitions, type: 'array', oneOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }] },
        ],
        ['written in place', { type: 'array', oneOf: [{ const: [1, 2] }, { const: [3] }] }],
      ])('clears an array the options %s do not offer, and keeps one they do', (_, select) => {
        expect(sanitize(select, unlisted, [5])).toBeUndefined();
        expect(sanitize(select, unlisted, [1, 2])).toEqual([1, 2]);
      });
      it('keeps an array the same options written as $refs did not offer either', () => {
        const select: RJSFSchema = {
          definitions,
          type: 'array',
          oneOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }],
        };
        expect(sanitize(select, { ...select, title: 'Old' }, [5])).toEqual([5]);
      });
      it('reads an old option whose $ref names nothing under the new root as listing no values', () => {
        const select: RJSFSchema = {
          definitions,
          type: 'array',
          oneOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }],
        };
        // The old schema comes from a root that defined `gone`
        const oldSelect: RJSFSchema = {
          type: 'array',
          oneOf: [{ const: [1, 2] }, { $ref: '#/definitions/gone' }, { $ref: '#/definitions/b' }],
        };
        expect(sanitize(select, oldSelect, [5])).toBeUndefined();
        expect(sanitize(select, oldSelect, [3])).toEqual([3]);
      });
    });
    describe('with keys named like Object.prototype members', () => {
      it('seeds the default of a new property named toString, which the data does not hold', () => {
        const oldSchema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
        // `as const` keeps the type name a literal, which the value of a `toString` key loses otherwise
        const newSchema: RJSFSchema = {
          type: 'object',
          properties: { toString: { type: 'string' as const, default: 'x' } },
        };
        const result = schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, {}) as Record<string, unknown>;
        expect(Object.hasOwn(result, 'toString')).toBe(true);
        expect(result.toString).toBe('x');
      });
      it('writes a __proto__ property as an own key without changing the prototype', () => {
        const oldSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string", "default": "old"}}}',
        ) as RJSFSchema;
        const newSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string", "default": "new"}, "nested": {"type": "object", "properties": {"__proto__": {"type": "string", "default": "inner"}}}}}',
        ) as RJSFSchema;
        const data = JSON.parse('{"__proto__": "old", "nested": {}}');
        const result = schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, data) as { nested: object };
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toBe('new');
        expect(Object.getOwnPropertyDescriptor(result.nested, '__proto__')?.value).toBe('inner');
        expect(Object.getPrototypeOf(result.nested)).toBe(Object.prototype);
      });
      // The prototype setter ignores a string or `undefined`, so each write below is only seen as an own key
      it('removes a __proto__ property that only the old schema declares', () => {
        const oldSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string"}}}',
        ) as RJSFSchema;
        const newSchema: RJSFSchema = { type: 'object', properties: { other: { type: 'string' } } };
        const data = JSON.parse('{"__proto__": "stale"}');
        const result = schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, data);
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        expect(Object.hasOwn(result as object, '__proto__')).toBe(false);
      });
      it('removes a __proto__ property whose new default is readOnly', () => {
        const oldSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string", "default": "o"}}}',
        ) as RJSFSchema;
        const newSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string", "default": "n", "readOnly": true}}}',
        ) as RJSFSchema;
        const data = JSON.parse('{"__proto__": "user"}');
        const result = schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, data);
        expect(Object.hasOwn(result as object, '__proto__')).toBe(false);
      });
      it('replaces the old const of a __proto__ property with the new one', () => {
        const oldSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string", "const": "a"}}}',
        ) as RJSFSchema;
        const newSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string", "const": "b"}}}',
        ) as RJSFSchema;
        const data = JSON.parse('{"__proto__": "a"}');
        const result = schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, data);
        expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toBe('b');
      });
      it('replaces a __proto__ property value the new enum no longer offers', () => {
        const oldSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string", "enum": ["a"]}}}',
        ) as RJSFSchema;
        const newSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "string", "enum": ["b"]}}}',
        ) as RJSFSchema;
        const data = JSON.parse('{"__proto__": "a"}');
        const result = schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, data);
        expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toBe('b');
      });
      it('sanitizes the object held under a __proto__ property and keeps it an own key', () => {
        const oldSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "object", "properties": {"a": {"type": "string"}, "b": {"type": "string"}}}}}',
        ) as RJSFSchema;
        const newSchema = JSON.parse(
          '{"type": "object", "properties": {"__proto__": {"type": "object", "properties": {"a": {"type": "string"}}}}}',
        ) as RJSFSchema;
        const data = JSON.parse('{"__proto__": {"a": "kept", "b": "dropped"}}');
        const result = schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, data);
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual({ a: 'kept', b: undefined });
      });
    });
  });
}
