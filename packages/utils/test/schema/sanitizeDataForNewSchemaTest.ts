import type { SchemaUtilsType, RJSFSchema } from '../../src/index.ts';
import { createSchemaUtils, sanitizeDataForNewSchema, setByPath } from '../../src/index.ts';
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
    // Shared by the #4476 tests, whose two options differ only in the defaults their nested structures carry
    const runnerSchema = (name: string, ratio: number, readOnly?: boolean): RJSFSchema => ({
      type: 'object',
      ...(readOnly === undefined ? {} : { readOnly }),
      properties: {
        name: { type: 'string' },
        ratio: { type: 'number' },
      },
      default: { name, ratio },
    });
    const runnersSchema = (name: string, ratio: number): RJSFSchema => ({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          ratio: { type: 'number' },
        },
      },
      default: [{ name, ratio }],
    });
    const numbersSchema = (value: number): RJSFSchema => ({
      type: 'array',
      items: { type: 'number' },
      default: [value],
    });
    const propertyOf = (key: string, schema: RJSFSchema): RJSFSchema => ({
      type: 'object',
      properties: { [key]: schema },
    });
    let schemaUtils: SchemaUtilsType;
    beforeAll(() => {
      schemaUtils = createSchemaUtils(testValidator, oneOfSchema);
    });
    it('returns undefined when the new schema does not contain a "property" object', () => {
      expect(sanitizeDataForNewSchema(testValidator, oneOfSchema, {}, {})).toBeUndefined();
    });
    it('returns input formData when the old schema is not an object', () => {
      const newSchema = schemaUtils.retrieveSchema(SECOND_ONE_OF, oneOfSchema);
      expect(sanitizeDataForNewSchema(testValidator, oneOfSchema, newSchema, undefined, oneOfData)).toEqual(oneOfData);
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
      expect(sanitizeDataForNewSchema(testValidator, oneOfSchema, newSchema, oldSchema, { foo: 'x' })).toEqual({
        foo: 'x',
      });
    });
    it('handles an explicitly undefined property schema without crashing', () => {
      // A JS-authored schema can conditionally omit a property with `{ properties: { foo: cond ? {...} : undefined } }`
      const oldSchema = { type: 'object', properties: { foo: {} } } as RJSFSchema;
      const newSchema = { type: 'object', properties: { foo: undefined } } as unknown as RJSFSchema;
      expect(sanitizeDataForNewSchema(testValidator, oneOfSchema, newSchema, oldSchema, { foo: 'x' })).toEqual({
        foo: 'x',
      });
    });
    it('returns input formData when the old schema does not contain a "property" object', () => {
      const newSchema = schemaUtils.retrieveSchema(SECOND_ONE_OF, oneOfSchema);
      expect(sanitizeDataForNewSchema(testValidator, oneOfSchema, newSchema, {}, oneOfData)).toEqual(oneOfData);
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
    it('keeps invalid data when oneOf does not provide enum-like values', () => {
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
        enumField: 'oldData',
      });
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
      expect(sanitizeDataForNewSchema(testValidator, rootSchema, newSchema, oldSchema, { oldField: 'test' })).toEqual(
        {},
      );
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
        sanitizeDataForNewSchema(testValidator, rootSchema, rootSchema, rootSchema, {
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
        sanitizeDataForNewSchema(testValidator, rootSchema, rootSchema, rootSchema, [
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
        sanitizeDataForNewSchema(testValidator, rootSchema, rootSchema, rootSchema, [
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
      expect(sanitizeDataForNewSchema(testValidator, rootSchema, newSchema, oldSchema, ['1', '2'])).toEqual(['1', '2']);
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
    it("replaces an object property still holding the old schema's default with the new default (#4476)", () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runner', runnerSchema('test2-runner-1', 2)),
          propertyOf('runner', runnerSchema('test1-runner-1', 1)),
          { runner: { name: 'test1-runner-1', ratio: 1 } },
        ),
      ).toEqual({ runner: { name: 'test2-runner-1', ratio: 2 } });
    });
    it("keeps an object property the user changed away from the old schema's default (#4476)", () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runner', runnerSchema('test2-runner-1', 2)),
          propertyOf('runner', runnerSchema('test1-runner-1', 1)),
          { runner: { name: 'my-runner', ratio: 7 } },
        ),
      ).toEqual({ runner: { name: 'my-runner', ratio: 7 } });
    });
    it('keeps an object property whose default is unchanged between the two schemas (#4476)', () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runner', runnerSchema('runner-1', 1)),
          propertyOf('runner', runnerSchema('runner-1', 1)),
          { runner: { name: 'runner-1', ratio: 1 } },
        ),
      ).toEqual({ runner: { name: 'runner-1', ratio: 1 } });
    });
    it("replaces an array property still holding the old schema's default with the new default (#4476)", () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(propertyOf('arr', numbersSchema(2)), propertyOf('arr', numbersSchema(1)), {
          arr: [1],
        }),
      ).toEqual({ arr: [2] });
    });
    it("keeps an array property the user changed away from the old schema's default (#4476)", () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(propertyOf('arr', numbersSchema(2)), propertyOf('arr', numbersSchema(1)), {
          arr: [5, 6],
        }),
      ).toEqual({ arr: [5, 6] });
    });
    it("replaces an array-of-objects property still holding the old schema's default with the new default (#4476)", () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runners', runnersSchema('test2-runner-1', 2)),
          propertyOf('runners', runnersSchema('test1-runner-1', 1)),
          { runners: [{ name: 'test1-runner-1', ratio: 1 }] },
        ),
      ).toEqual({ runners: [{ name: 'test2-runner-1', ratio: 2 }] });
    });
    it('clears a readOnly object property the user changed away from a default the new schema alters (#4476)', () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runner', runnerSchema('test2-runner-1', 2, true)),
          propertyOf('runner', runnerSchema('test1-runner-1', 1, false)),
          { runner: { name: 'my-runner', ratio: 7 } },
        ),
      ).toEqual({ runner: undefined });
    });
    it("initializes a newly defined object property from the new schema's default (#4476)", () => {
      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runner', runnerSchema('test2-runner-1', 2)),
          oldDisjointSchema,
          {
            idCode: undefined,
          },
        ),
      ).toEqual({ idCode: undefined, runner: { name: 'test2-runner-1', ratio: 2 } });
    });
    it('keeps a readOnly property whose schema the option switch left untouched (#4476)', () => {
      // The value differs from the schema's `default`, but nothing about the property changed, so it is the server's
      // data rather than a stale default and must survive the switch
      const tags: RJSFSchema = { type: 'array', readOnly: true, items: { type: 'string' }, default: [] };
      const oldSchema: RJSFSchema = { type: 'object', properties: { tags, a: { type: 'string' } } };
      const newSchema: RJSFSchema = { type: 'object', properties: { tags, b: { type: 'string' } } };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { tags: ['x'], a: 'q' })).toEqual({
        tags: ['x'],
        a: undefined,
      });
    });
    it('keeps an object value carrying an undefined key that the const it changed to already matches (#4476)', () => {
      // Sanitizing writes `undefined` for the keys it clears, so a value that already satisfies the new `const`
      // arrives here carrying keys the `const` does not spell out and must not be counted as stale for them
      const constOf = (a: number): RJSFSchema =>
        ({ type: 'object', const: { a }, properties: { a: { type: 'number' } } }) as RJSFSchema;

      expect(
        schemaUtils.sanitizeDataForNewSchema(propertyOf('c', constOf(2)), propertyOf('c', constOf(1)), {
          c: { a: 2, b: undefined },
        }),
      ).toEqual({ c: { a: 2, b: undefined } });
    });
    it("replaces an object default the form computed from a child's own default (#4476)", () => {
      // `getDefaultFormState` merges each child default into the parent's, so the data the form holds is
      // `{ name, ratio }` even though the schema's `default` only spells out `name`
      const withChildDefault = (name: string): RJSFSchema => ({
        type: 'object',
        default: { name },
        properties: {
          name: { type: 'string' },
          ratio: { type: 'number', default: 0 },
        },
      });

      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runner', withChildDefault('t2')),
          propertyOf('runner', withChildDefault('t1')),
          { runner: { name: 't1', ratio: 0 } },
        ),
      ).toEqual({ runner: { name: 't2', ratio: 0 } });
    });
    it('replaces a stale default that sits on the items of an array of objects (#4476)', () => {
      const itemsWithDefault = (name: string): RJSFSchema => ({
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' } },
          default: { name },
        },
      });

      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runners', itemsWithDefault('t2')),
          propertyOf('runners', itemsWithDefault('t1')),
          { runners: [{ name: 't1' }] },
        ),
      ).toEqual({ runners: [{ name: 't2' }] });
    });
    it('keeps an object value with an undefined key that the enum it narrowed to still allows (#4476)', () => {
      const enumOf = (values: unknown[]): RJSFSchema =>
        ({ type: 'object', enum: values, properties: { a: { type: 'number' }, b: { type: 'number' } } }) as RJSFSchema;

      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('e', enumOf([{ a: 2 }, { a: 3 }])),
          propertyOf('e', enumOf([{ a: 1 }, { a: 2 }])),
          { e: { a: 2, b: undefined } },
        ),
      ).toEqual({ e: { a: 2, b: undefined } });
    });
    it('keeps the elements of an array whose items schema would clear rather than replace them (#4476)', () => {
      // A cleared element would be dropped from the array rather than emptied, so the user's own entries would
      // silently disappear; they fall through to the recursion instead
      const items = (name: string, readOnly: boolean): RJSFSchema =>
        ({
          type: 'object',
          readOnly,
          properties: { name: { type: 'string' } },
          default: { name },
        }) as RJSFSchema;
      const oldSchema: RJSFSchema = { type: 'object', properties: { r: { type: 'array', items: items('t1', false) } } };
      const newSchema: RJSFSchema = { type: 'object', properties: { r: { type: 'array', items: items('t2', true) } } };

      expect(
        schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { r: [{ name: 'mine' }, { name: 'other' }] }),
      ).toEqual({ r: [{ name: 'mine' }, { name: 'other' }] });
    });
    it('does not substitute the sole allowed value for an element a narrowed items enum rejects (#4476)', () => {
      const arrayOf = (values: unknown[]): RJSFSchema =>
        ({
          type: 'array',
          items: { type: 'object', enum: values, properties: { a: { type: 'number' } } },
        }) as RJSFSchema;
      const oldSchema: RJSFSchema = { type: 'object', properties: { r: arrayOf([{ a: 1 }, { a: 2 }]) } };
      const newSchema: RJSFSchema = { type: 'object', properties: { r: arrayOf([{ a: 1 }]) } };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { r: [{ a: 1 }, { a: 2 }] })).toEqual({
        r: [{ a: 1 }, { a: 2 }],
      });
    });
    it('keeps the keys of a replacing default that the schema declares no property for (#4476)', () => {
      // `getDefaultFormState` emits only declared properties, so it alone would reduce the first default to
      // `{ name }` and the second, whose schema has no `properties` at all, to `{}`
      const withExtra = (name: string): RJSFSchema => ({
        type: 'object',
        properties: { name: { type: 'string' } },
        default: { name, extra: 'keep' },
      });
      const bare = (name: string): RJSFSchema => ({ type: 'object', default: { name } });

      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('runner', withExtra('t2')),
          propertyOf('runner', withExtra('t1')),
          {
            runner: { name: 't1', extra: 'keep' },
          },
        ),
      ).toEqual({ runner: { name: 't2', extra: 'keep' } });
      expect(
        schemaUtils.sanitizeDataForNewSchema(propertyOf('runner', bare('t2')), propertyOf('runner', bare('t1')), {
          runner: { name: 't1' },
        }),
      ).toEqual({ runner: { name: 't2' } });
    });
    it('keeps an object property whose value violates a const the option switch left untouched (#4476)', () => {
      const c = { type: 'object', const: { a: 1 }, properties: { a: { type: 'number' } } } as RJSFSchema;
      const oldSchema: RJSFSchema = { type: 'object', properties: { c, x: { type: 'string' } } };
      const newSchema: RJSFSchema = { type: 'object', properties: { c, y: { type: 'string' } } };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { c: { a: 2 }, x: 'q' })).toEqual({
        c: { a: 2 },
        x: undefined,
      });
    });
    it('replaces an object property whose const differs between the two schemas (#4476)', () => {
      const constOf = (a: number): RJSFSchema =>
        ({ type: 'object', const: { a }, properties: { a: { type: 'number' } } }) as RJSFSchema;

      expect(
        schemaUtils.sanitizeDataForNewSchema(propertyOf('c', constOf(2)), propertyOf('c', constOf(1)), {
          c: { a: 1 },
        }),
      ).toEqual({ c: { a: 2 } });
    });
    it('keeps an object property that an unchanged sole enum value would otherwise substitute (#4476)', () => {
      // Only the first option contributes an enum-like value, so the other option's data would be replaced by it
      const k = {
        type: 'object',
        oneOf: [{ const: { a: 1 } }, { title: 'other', properties: { b: { type: 'string' } } }],
        properties: { a: { type: 'number' }, b: { type: 'string' } },
      } as RJSFSchema;
      const oldSchema: RJSFSchema = { type: 'object', properties: { k, x: { type: 'string' } } };
      const newSchema: RJSFSchema = { type: 'object', properties: { k, y: { type: 'string' } } };

      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { k: { b: 'hello' }, x: 'q' })).toEqual({
        k: { b: 'hello' },
        x: undefined,
      });
    });
    it('replaces an object property whose enum differs between the two schemas (#4476)', () => {
      const enumOf = (values: unknown[]): RJSFSchema =>
        ({ type: 'object', enum: values, properties: { a: { type: 'number' } } }) as RJSFSchema;

      expect(
        schemaUtils.sanitizeDataForNewSchema(
          propertyOf('e', enumOf([{ a: 9 }])),
          propertyOf('e', enumOf([{ a: 1 }, { a: 2 }])),
          {
            e: { a: 1 },
          },
        ),
      ).toEqual({ e: { a: 9 } });
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
  });
}
