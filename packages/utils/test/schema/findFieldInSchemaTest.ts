import type { RJSFSchema } from '../../src/index.ts';
import { createSchemaUtils, getByPath, PROPERTIES_KEY } from '../../src/index.ts';
import { ANSWER_1, CHOICES, testAnyOfSchema, testOneOfSchema } from '../testUtils/testData.ts';
import type { TestValidatorType } from './types.ts';

const simpleSchema: RJSFSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
  },
  required: ['name'],
};

const nestedSimpleSchema: RJSFSchema = {
  type: 'object',
  properties: {
    nested: simpleSchema,
  },
};

const NOT_FOUND = { field: undefined, isRequired: undefined };

const nestedOneOf: RJSFSchema = {
  type: 'object',
  properties: {
    nested: testOneOfSchema,
  },
};

const nestedAnyOf: RJSFSchema = {
  type: 'object',
  properties: {
    nested: testAnyOfSchema,
  },
};

export default function findFieldInSchemaTest(testValidator: TestValidatorType) {
  // Root schema is not needed for these tests
  const schemaUtils = createSchemaUtils({ validator: testValidator }, {});
  const expectedAnswerField = getByPath(CHOICES[0], [PROPERTIES_KEY, 'answer']);

  describe('findFieldInSchema', () => {
    it('returns NOT_FOUND when path is empty', () => {
      expect(schemaUtils.findFieldInSchema({}, [])).toEqual(NOT_FOUND);
    });
    it('returns NOT_FOUND when schema does not have properties', () => {
      expect(schemaUtils.findFieldInSchema({}, 'foo')).toEqual(NOT_FOUND);
    });
    it('return NOT_FOUND when field does not exist in the schema', () => {
      expect(schemaUtils.findFieldInSchema(simpleSchema, 'foo')).toEqual(NOT_FOUND);
    });
    it('returns NOT_FOUND when the path traverses a boolean subschema', () => {
      const booleanPropSchema: RJSFSchema = {
        type: 'object',
        properties: { a: false },
      };
      expect(schemaUtils.findFieldInSchema(booleanPropSchema, 'a.b')).toEqual(NOT_FOUND);
    });
    it('returns field as required', () => {
      const path = ['name'];
      const expectedField = getByPath(simpleSchema, [PROPERTIES_KEY, path[0]]);
      expect(schemaUtils.findFieldInSchema(simpleSchema, path)).toEqual({
        field: expectedField,
        isRequired: true,
      });
    });
    it('returns field as not required', () => {
      const path = ['age'];
      const expectedField = getByPath(simpleSchema, [PROPERTIES_KEY, path[0]]);
      expect(schemaUtils.findFieldInSchema(simpleSchema, path)).toEqual({
        field: expectedField,
        isRequired: false,
      });
    });
    it('returns nested field as required', () => {
      const path = ['nested', 'name'];
      const expectedField = getByPath(simpleSchema, [PROPERTIES_KEY, path[1]]);
      expect(schemaUtils.findFieldInSchema(nestedSimpleSchema, path)).toEqual({
        field: expectedField,
        isRequired: true,
      });
    });
    it('returns nested field as not required', () => {
      const path = ['nested', 'age'];
      const expectedField = getByPath(simpleSchema, [PROPERTIES_KEY, path[1]]);
      expect(schemaUtils.findFieldInSchema(nestedSimpleSchema, path)).toEqual({
        field: expectedField,
        isRequired: false,
      });
    });
    it('resolves numeric path segments (FieldPathList) the same as string keys', () => {
      const schemaWithNumericPropertyName: RJSFSchema = {
        type: 'object',
        properties: {
          '0': {
            type: 'string',
          },
        },
      };
      const fieldPathList = [0] as (string | number)[];
      expect(schemaUtils.findFieldInSchema(schemaWithNumericPropertyName, fieldPathList)).toEqual({
        field: { type: 'string' },
        isRequired: false,
      });
    });
    it('schema has oneOf field in properties key and isRequired true', () => {
      const path = 'answer';
      expect(schemaUtils.findFieldInSchema(testOneOfSchema, path, ANSWER_1)).toEqual({
        field: expectedAnswerField,
        isRequired: true,
      });
    });
    it('schema has anyOf field in properties key and isRequired false', () => {
      const path = 'answer';
      expect(schemaUtils.findFieldInSchema(testAnyOfSchema, path, ANSWER_1)).toEqual({
        field: expectedAnswerField,
        isRequired: true,
      });
    });
    it('drills into the anyOf when the schema also has a oneOf (#5309)', () => {
      const schema: RJSFSchema = {
        ...testAnyOfSchema,
        oneOf: [{ type: 'object', properties: { answer: { type: 'number', title: 'Other' } } }],
      };
      expect(schemaUtils.findFieldInSchema(schema, 'answer', ANSWER_1).field).toEqual(expectedAnswerField);
    });
    it('finds the property a schema declares beside its options', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { own: { type: 'string', title: 'Own' } },
        required: ['own'],
        oneOf: CHOICES,
      };
      expect(schemaUtils.findFieldInSchema(schema, 'own', ANSWER_1)).toEqual({
        field: { type: 'string', title: 'Own' },
        isRequired: true,
      });
    });
    it('finds a property of the option selected by the data of the object it is in, at any depth', () => {
      const nested: RJSFSchema = {
        type: 'object',
        properties: { outer: { type: 'object', properties: { nested: testOneOfSchema } } },
      };
      expect(schemaUtils.findFieldInSchema(nested, 'outer.nested.answer', { outer: { nested: ANSWER_1 } })).toEqual({
        field: expectedAnswerField,
        isRequired: true,
      });
    });
    it('walks through an option to a property inside one of its properties', () => {
      const through: RJSFSchema = {
        type: 'object',
        discriminator: { propertyName: 'kind' },
        oneOf: [
          {
            type: 'object',
            properties: {
              kind: { const: 'a' },
              inner: { type: 'object', properties: { leaf: { type: 'number' } }, required: ['leaf'] },
            },
          },
          { type: 'object', properties: { kind: { const: 'b' } } },
        ],
      };
      expect(schemaUtils.findFieldInSchema(through, 'inner.leaf', { kind: 'a' })).toEqual({
        field: { type: 'number' },
        isRequired: true,
      });
    });
    it('hands each caller its own result where nothing is found', () => {
      schemaUtils.findFieldInSchema(simpleSchema, 'missing').isRequired = true;
      expect(schemaUtils.findFieldInSchema(simpleSchema, 'missing')).toEqual(NOT_FOUND);
    });
    it('reads a property left empty beside the options from the selected option', () => {
      const leftEmpty = {
        type: 'object',
        discriminator: { propertyName: 'kind' },
        properties: { a: null },
        oneOf: [{ type: 'object', properties: { kind: { const: 'k' }, a: { type: 'string' } } }],
      } as unknown as RJSFSchema;
      expect(schemaUtils.findFieldInSchema(leftEmpty, 'a', { kind: 'k' }).field).toEqual({ type: 'string' });
    });
    describe('a property in an option with no selector', () => {
      const first: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
      const second: RJSFSchema = { type: 'object', properties: { b: { type: 'number' } } };
      const schema: RJSFSchema = { type: 'object', anyOf: [first, second] };

      afterEach(() => {
        testValidator.reset?.();
      });

      it('finds it in the option the data matches closest', () => {
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(schemaUtils.findFieldInSchema(schema, 'b', { b: 1 })).toEqual({
          field: { type: 'number' },
          isRequired: false,
        });
      });
      it('does not find a property of an option the data does not match', () => {
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(schemaUtils.findFieldInSchema(schema, 'a', { b: 1 })).toEqual(NOT_FOUND);
      });
    });
    describe('a key no property declares', () => {
      it('finds the schema of the pattern it matches', () => {
        const schema: RJSFSchema = {
          type: 'object',
          patternProperties: { '^x-': { type: 'number' } },
          required: ['x-a'],
        };
        expect(schemaUtils.findFieldInSchema(schema, 'x-a', { 'x-a': 1 })).toEqual({
          field: { type: 'number' },
          isRequired: true,
        });
      });
      it('finds additionalProperties, on the way to a nested field too', () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: { type: 'object', properties: { leaf: { type: 'string' } } },
        };
        expect(schemaUtils.findFieldInSchema(schema, 'any.leaf', { any: { leaf: 'x' } })).toEqual({
          field: { type: 'string' },
          isRequired: false,
        });
      });
      it('prefers a property of the selected option over additionalProperties beside it', () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: { type: 'number' },
          oneOf: CHOICES,
        };
        expect(schemaUtils.findFieldInSchema(schema, 'answer', ANSWER_1).field).toEqual(expectedAnswerField);
      });
      describe('beside a selected option', () => {
        const besideOption = (parent: RJSFSchema, option: RJSFSchema): RJSFSchema => ({
          type: 'object',
          discriminator: { propertyName: 'kind' },
          ...parent,
          oneOf: [{ type: 'object', properties: { kind: { const: 'a' } }, ...option }],
        });

        it.each([{ kind: 'a' }, { kind: 'a', y: 1 }])('does not find a key the parent forbids with data %j', (data) => {
          const schema = besideOption({ additionalProperties: false }, { additionalProperties: { type: 'number' } });
          expect(schemaUtils.findFieldInSchema(schema, 'y', data)).toEqual(NOT_FOUND);
        });
        it.each([{ kind: 'a' }, { kind: 'a', y: 4 }])('describes a key by both schemas with data %j', (data) => {
          const schema = besideOption(
            { additionalProperties: { type: 'number' } },
            { additionalProperties: { minimum: 3 } },
          );
          expect(schemaUtils.findFieldInSchema(schema, 'y', data).field).toEqual({ type: 'number', minimum: 3 });
        });
        it.each([{ kind: 'a' }, { kind: 'a', y: 's' }])(
          'leaves a key the option evaluates to the option with data %j',
          (data) => {
            const schema = besideOption(
              { unevaluatedProperties: { type: 'number' } },
              {
                additionalProperties: { type: 'string' },
              },
            );
            expect(schemaUtils.findFieldInSchema(schema, 'y', data).field).toEqual({ type: 'string' });
          },
        );
        it('applies the required of the option and of the parent to an extra key', () => {
          const additionalProperties: RJSFSchema = { type: 'number' };
          const inOption = besideOption({}, { additionalProperties, required: ['y'] });
          const inParent = besideOption({ required: ['y'] }, { additionalProperties });
          expect(schemaUtils.findFieldInSchema(inOption, 'y', { kind: 'a' }).isRequired).toBe(true);
          expect(schemaUtils.findFieldInSchema(inParent, 'y', { kind: 'a' }).isRequired).toBe(true);
        });
      });
      it('reads a key the data holds as it reads one it does not', () => {
        const nested = (additionalProperties: RJSFSchema | boolean): RJSFSchema => ({
          type: 'object',
          additionalProperties: { type: 'object', additionalProperties },
        });
        expect(schemaUtils.findFieldInSchema(nested(true), 'a.b', { a: { b: 'x' } })).toEqual(NOT_FOUND);
        expect(schemaUtils.findFieldInSchema(nested({ type: 'number' }), 'a.b', { a: { b: 1 } })).toEqual({
          field: { type: 'number' },
          isRequired: false,
        });
      });
      it('does not read an empty path segment as a key', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'object', additionalProperties: { type: 'number' } } },
          additionalProperties: { type: 'number' },
        };
        expect(schemaUtils.findFieldInSchema(schema, '')).toEqual(NOT_FOUND);
        expect(schemaUtils.findFieldInSchema(schema, 'a.')).toEqual(NOT_FOUND);
      });
      it('does not find a key additionalProperties forbids, or one a schema says nothing about', () => {
        expect(schemaUtils.findFieldInSchema({ type: 'object', additionalProperties: false }, 'x')).toEqual(NOT_FOUND);
        expect(schemaUtils.findFieldInSchema({ type: 'object' }, 'x')).toEqual(NOT_FOUND);
      });
    });
    it('applies the required of the parent to a property of its selected option', () => {
      expect(schemaUtils.findFieldInSchema(testOneOfSchema, 'answer', { answer: '2' }).isRequired).toBe(true);
    });
    it('follows a schema that is a $ref to its options and extra keys', () => {
      const definitions: RJSFSchema['definitions'] = {
        choice: testOneOfSchema,
        map: { type: 'object', additionalProperties: { type: 'number' } },
      };
      const utils = createSchemaUtils({ validator: testValidator }, { definitions });
      expect(utils.findFieldInSchema({ $ref: '#/definitions/choice' }, 'answer', ANSWER_1)).toEqual({
        field: expectedAnswerField,
        isRequired: true,
      });
      expect(utils.findFieldInSchema({ $ref: '#/definitions/map' }, 'x').field).toEqual({ type: 'number' });
    });
    it('schema has oneOf in nested field in properties key and isRequired true', () => {
      const path = 'nested.answer';
      expect(schemaUtils.findFieldInSchema(nestedOneOf, path, { nested: ANSWER_1 })).toEqual({
        field: expectedAnswerField,
        isRequired: true,
      });
    });
    it('schema has anyOf in nested field in properties key and isRequired false', () => {
      const path = 'nested.answer';
      expect(schemaUtils.findFieldInSchema(nestedAnyOf, path, { nested: ANSWER_1 })).toEqual({
        field: expectedAnswerField,
        isRequired: true,
      });
    });
  });
}
