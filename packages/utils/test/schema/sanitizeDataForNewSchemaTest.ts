import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import type { SchemaUtilsType, RJSFSchema } from '../../src';
import { createSchemaUtils, sanitizeDataForNewSchema } from '../../src';
import { FIRST_ONE_OF, oneOfData, oneOfSchema, SECOND_ONE_OF } from '../testUtils/testData';
import type { TestValidatorType } from './types';

export default function sanitizeDataForNewSchemaTest(testValidator: TestValidatorType) {
  describe('sanitizeDataForNewSchema', () => {
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
    it('returns input formData when the old schema does not contain a "property" object', () => {
      const newSchema = schemaUtils.retrieveSchema(SECOND_ONE_OF, oneOfSchema);
      expect(sanitizeDataForNewSchema(testValidator, oneOfSchema, newSchema, {}, oneOfData)).toEqual(oneOfData);
    });
    it('returns input formData when the new schema matches the data for the new schema rather than the old', () => {
      const newSchema = schemaUtils.retrieveSchema(SECOND_ONE_OF, oneOfSchema);
      const oldSchema = cloneDeep(schemaUtils.retrieveSchema(FIRST_ONE_OF, oneOfSchema));
      // Change the type of name to trigger a fall-thru
      set(oldSchema, ['properties', 'name', 'type'], 'boolean');
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
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { enumField: 'oldData' })).toEqual({
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
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { enumField: 'keptData' })).toEqual({
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
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { enumField: 'oldData' })).toEqual({
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
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { enumField: 'oldData' })).toEqual({
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
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { enumField: 'oldData' })).toEqual({
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
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { enumField: 'oldData' })).toEqual({
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
      expect(schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, { enumField: 'oldData' })).toEqual({
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
