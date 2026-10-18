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
    it('gives an object property the data does not hold an empty object, without descending into a recursive $ref', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          node: { type: 'object', properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } } },
        },
      };
      const treeOption: RJSFSchema = { type: 'object', properties: { tree: { $ref: '#/definitions/node' } } };
      const otherOption: RJSFSchema = { type: 'object', properties: { b: { type: 'string' } } };
      expect(
        sanitizeDataForNewSchema({ validator: testValidator }, rootSchema, treeOption, otherOption, { b: 'v' }),
      ).toEqual({ b: undefined, tree: {} });
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
    it('trims an array whose boolean items both schemas share to the new maxItems', () => {
      const oldSchema: RJSFSchema = { type: 'array', items: true };
      const newSchema: RJSFSchema = { type: 'array', items: true, maxItems: 2 };
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, [1, 2, 3])).toEqual([1, 2]);
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
    });
  });
}
