import type { RJSFMarkedSchema, SchemaUtilsType, RJSFSchema } from '../../src/index.ts';
import { createSchemaUtils, GUESSED_TYPE_FLAG, sanitizeDataForNewSchema, setByPath } from '../../src/index.ts';
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

      expect(schemaUtils.sanitizeDataForNewSchema(newArraySchema, oldSchema, { values: ['existing'] })).toEqual({
        values: undefined,
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
      ).toEqual({
        enumField: undefined,
      });
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
      ).toEqual({
        enumField: undefined,
      });
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
    it('returns undefined when two arrays have differing boolean items', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: false,
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: true,
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1])).toBeUndefined();
    });
    it('returns undefined when one array has boolean items', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: false,
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: { type: 'string' },
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1])).toBeUndefined();
    });
    it('returns undefined when both arrays has array items', () => {
      const oldSchema: RJSFSchema = {
        type: 'array',
        items: [true],
      };
      const newSchema: RJSFSchema = {
        type: 'array',
        items: [{ type: 'string' }],
      };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1])).toBeUndefined();
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
    it('keeps items when only a sibling schema changed and the items schema is unchanged (#5451)', () => {
      const oldSchema: RJSFSchema = {
        type: 'object',
        properties: {
          sibling: { type: 'string', enum: ['x', 'y'] },
          list: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } },
        },
      };
      const newSchema: RJSFSchema = {
        type: 'object',
        properties: {
          sibling: { type: 'string', enum: ['x'] },
          list: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } },
        },
      };
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          newSchema,
          oldSchema,
          { sibling: 'y', list: ['a', 'legacy', null] },
          { sibling: 'y', list: ['a', 'legacy', null] },
        ),
        // The sibling's removed value falls back to the only allowed enum value; with the previous data
        // passed, the way Form calls it, the untouched list is kept whole
      ).toEqual({ sibling: 'x', list: ['a', 'legacy', null] });
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
    describe('with the previous data passed, the way Form calls it', () => {
      it('keeps fields a nested conditional hides or retypes, since the previous data only decides the enum filter', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: { pick: { type: 'string' } },
              if: { properties: { pick: { const: 'y' } }, required: ['pick'] },
              then: { properties: { extra: { type: 'string' } } },
            },
          },
        };
        testValidator.setReturnValues({ isValid: [true, false] });
        // pick flipped from 'y' to 'x', so `extra` is no longer in the resolved schema; v7 keeps the value
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            { obj: { pick: 'x', extra: 'e' } },
            { obj: { pick: 'y', extra: 'e' } },
          ),
        ).toEqual({ obj: { pick: 'x', extra: 'e' } });
        const retypeSchema: RJSFSchema = {
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: { pick: { type: 'string' } },
              if: { properties: { pick: { const: 'y' } }, required: ['pick'] },
              then: { properties: { val: { type: 'number' } } },
              else: { properties: { val: { type: 'string' } } },
            },
          },
        };
        testValidator.setReturnValues({ isValid: [true, false] });
        // The flipped conditional retypes `val` from number to string; v7 keeps the value rather than clearing it
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            retypeSchema,
            retypeSchema,
            { obj: { pick: 'x', val: 5 } },
            { obj: { pick: 'y', val: 5 } },
          ),
        ).toEqual({ obj: { pick: 'x', val: 5 } });
      });
      it('keeps element values across a reorder or removal when pairing by index', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: { t: { type: 'string' } },
                if: { properties: { t: { const: 'y' } }, required: ['t'] },
                then: { properties: { v: { type: 'number' } } },
                else: { properties: { v: { type: 'string' } } },
              },
            },
          },
        };
        testValidator.setReturnValues({ isValid: [false, false, true, false, false, true] });
        // Reordered: pairing by index compares against the other row's branch, but only the filter may go wrong
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            {
              rows: [
                { t: 'x', v: 's' },
                { t: 'y', v: 5 },
              ],
            },
            {
              rows: [
                { t: 'y', v: 5 },
                { t: 'x', v: 's' },
              ],
            },
          ),
        ).toEqual({
          rows: [
            { t: 'x', v: 's' },
            { t: 'y', v: 5 },
          ],
        });
        testValidator.setReturnValues({ isValid: [false, false, true, false] });
        // First row removed
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            { rows: [{ t: 'x', v: 's' }] },
            {
              rows: [
                { t: 'y', v: 5 },
                { t: 'x', v: 's' },
              ],
            },
          ),
        ).toEqual({ rows: [{ t: 'x', v: 's' }] });
      });
      it('treats a subtree missing from the previous data as a previous value of undefined, not as no previous data', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: {
                pick: { type: 'string', enum: ['x', 'y'] },
                list: { type: 'array', minItems: 2, items: { type: 'string', enum: ['a', 'b'] } },
              },
              if: { properties: { pick: { const: 'y' } }, required: ['pick'] },
              then: { properties: { extra: { type: 'string' } } },
            },
          },
        };
        testValidator.setReturnValues({ isValid: [false, false] });
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            { obj: { pick: 'x', list: [null, null] } },
            { other: 'z' },
          ),
        ).toEqual({ obj: { pick: 'x', list: [null, null] } });
      });
      it('keeps placeholders when an unrelated nested if/then made Form sanitize on every change (#5451)', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: {
                pick: { type: 'string', enum: ['x', 'y'] },
                list: { type: 'array', minItems: 2, items: { type: 'string', enum: ['a', 'b'] } },
              },
              // Unrelated to `list`: only adds a field
              if: { properties: { pick: { const: 'y' } }, required: ['pick'] },
              then: { properties: { extra: { type: 'string' } } },
            },
          },
        };
        testValidator.setReturnValues({ isValid: [true] });
        // The user flips `pick` back from 'y' to 'x'; the conditional never touches `list`
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            { obj: { pick: 'x', list: [null, null] } },
            { obj: { pick: 'y', list: [null, null] } },
          ),
        ).toEqual({ obj: { pick: 'x', list: [null, null] } });
      });
      it('keeps the data of a new array property whose items are true', () => {
        const oldSchema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
        const newSchema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' }, tags: { type: 'array', items: true } },
        };
        expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { tags: ['x', 1] }, {})).toEqual({
          tags: ['x', 1],
        });
      });
      it('does not fill defaults inside rows of a new array of objects', () => {
        const oldSchema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
        const newSchema: RJSFSchema = {
          type: 'object',
          properties: {
            a: { type: 'string' },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  k: { type: 'string', default: 'D' },
                  ro: { type: 'string', default: 'R', readOnly: true },
                },
              },
            },
          },
        };
        expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { rows: [{}, { ro: 'mine' }] }, {})).toEqual({
          rows: [{}, {}],
        });
      });
      it('keeps placeholders when the items schema merges a stable allOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            sibling: { type: 'string' },
            list: { type: 'array', items: { allOf: [{ type: 'string' }, { enum: ['a', 'b'] }] } },
          },
        };
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            { sibling: 'edited', list: [null, 'a'] },
            { sibling: 'before', list: [null, 'a'] },
          ),
        ).toEqual({ sibling: 'edited', list: [null, 'a'] });
      });
      it('keeps placeholders beside additionalProperties data', () => {
        // The stub schema `retrieveSchema` builds for the additionalProperties data changes the resolved
        // shape of the holder without depending on the data
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            sibling: { type: 'string' },
            holder: {
              type: 'object',
              properties: {
                list: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } },
              },
              additionalProperties: { type: 'string' },
            },
          },
        };
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            { sibling: 'edited', holder: { foo: 'bar', list: [null, 'a'] } },
            { sibling: 'before', holder: { foo: 'bar', list: [null, 'a'] } },
          ),
        ).toEqual({ sibling: 'edited', holder: { foo: 'bar', list: [null, 'a'] } });
      });
      it('keeps placeholders when the items schema sits behind a $ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: { List: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } } },
          properties: {
            sibling: { type: 'string' },
            list: { $ref: '#/definitions/List' },
          },
        };
        expect(
          // Called directly (rather than through `schemaUtils`) so this schema is the root the `$ref`
          // resolves against
          sanitizeDataForNewSchema(
            { validator: testValidator },
            schema,
            schema,
            schema,
            { sibling: 'edited', list: [null, 'a'] },
            { sibling: 'before', list: [null, 'a'] },
          ),
        ).toEqual({ sibling: 'edited', list: [null, 'a'] });
      });
      it('keeps an out-of-enum scalar when its schema is unchanged, like the array path', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            sibling: { type: 'string' },
            one: { type: 'string', enum: ['a', 'b'] },
            list: { type: 'array', items: { type: 'string', enum: ['a', 'b'] } },
          },
        };
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            { sibling: 'edited', one: 'legacy', list: ['legacy'] },
            { sibling: 'before', one: 'legacy', list: ['legacy'] },
          ),
        ).toEqual({ sibling: 'edited', one: 'legacy', list: ['legacy'] });
      });
      it('still filters items when the flip between previous and current data narrows the enum (#5250)', () => {
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
        // The current-data resolutions take the `then` branch (sibling 'x'); the filter chain resolves the
        // old side against the previous data (sibling 'y'), where no branch applies
        testValidator.setReturnValues({ isValid: [true, false, false, true, false] });
        // The user flips `sibling` to 'x', which applies the `then` branch narrowing the items enum. The old
        // side resolved against the previous data still offers 'b', so the two disagree and the filter runs
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            { obj: { sibling: 'x', list: ['a', 'b'] } },
            { obj: { sibling: 'y', list: ['a', 'b'] } },
          ),
        ).toEqual({ obj: { sibling: 'x', list: ['a'] } });
      });
      it('keeps the values of a reorder where both rows have previous elements', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  t: { type: 'string', enum: ['x', 'y'] },
                  v: { type: 'string' },
                },
                if: { properties: { t: { const: 'y' } }, required: ['t'] },
                then: { properties: { v: { enum: ['q'] } } },
              },
            },
          },
        };
        // The items schema against the current array, then for each element the current-data old side and
        // the filter chain against the previous element at the same index
        testValidator.setReturnValues({ isValid: [false, false, true, true, false] });
        // The user swapped the two rows: each element now pairs with the OTHER row's previous element. A
        // wrong pair can only get the enum filter decision wrong - removal, the type check and the
        // default/const swap all read the schema as the element itself resolves it - and here neither
        // mis-paired comparison drops a value the schema offers
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            {
              rows: [
                { t: 'x', v: 'free' },
                { t: 'y', v: 'q' },
              ],
            },
            {
              rows: [
                { t: 'y', v: 'q' },
                { t: 'x', v: 'free' },
              ],
            },
          ),
        ).toEqual({
          rows: [
            { t: 'x', v: 'free' },
            { t: 'y', v: 'q' },
          ],
        });
      });
      it('clears a moved row value the narrowed enum rejects when it has no previous element', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  t: { type: 'string', enum: ['x', 'y'] },
                  v: { type: 'string' },
                },
                if: { properties: { t: { const: 'y' } }, required: ['t'] },
                then: { properties: { v: { enum: ['q'] } } },
              },
            },
          },
        };
        // Four `isValid` calls happen: the items schema against the current array, then for each element the
        // current-data old side, and finally the filter chain against the previous element, resolved on first
        // need (the new side shares the current-data resolution, and the first row needs no filter decision, so
        // its previous-element chain is never resolved). Only the moved `t: 'y'` row takes the `then` branch,
        // on the current side
        testValidator.setReturnValues({ isValid: [false, false, true, false] });
        // The user inserted a row at the front: the `t: 'y'` row moved from index 0 to index 1, so it has no
        // previous element at its index and the filter chain resolves against `undefined` all the way down.
        // That takes no `then` branch, so `v` is a plain string on the old side against the narrowed enum on
        // the new side: the two differ and the value falls back to the only offered option
        expect(
          schemaUtils.sanitizeDataForNewSchema(
            schema,
            schema,
            {
              rows: [
                { t: 'x', v: 'q' },
                { t: 'y', v: 'free' },
              ],
            },
            { rows: [{ t: 'y', v: 'q' }] },
          ),
        ).toEqual({
          rows: [
            { t: 'x', v: 'q' },
            { t: 'y', v: 'q' },
          ],
        });
      });
    });
  });
}
