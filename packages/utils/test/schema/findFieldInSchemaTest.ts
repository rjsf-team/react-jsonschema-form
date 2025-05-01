import get from 'lodash/get';

import { createSchemaUtils, PROPERTIES_KEY, RJSFSchema } from '../../src';
import { TestValidatorType } from './types';
import { ANSWER_1, CHOICES, testAnyOfSchema, testOneOfSchema } from '../testUtils/testData';

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
  const schemaUtils = createSchemaUtils(testValidator, {});
  const expectedAnswerField = get(CHOICES[0], [PROPERTIES_KEY, 'answer']);

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
    it('returns field as required', () => {
      const path = ['name'];
      const expectedField = get(simpleSchema, [PROPERTIES_KEY, path[0]]);
      expect(schemaUtils.findFieldInSchema(simpleSchema, path)).toEqual({
        field: expectedField,
        isRequired: true,
      });
    });
    it('returns field as not required', () => {
      const path = ['age'];
      const expectedField = get(simpleSchema, [PROPERTIES_KEY, path[0]]);
      expect(schemaUtils.findFieldInSchema(simpleSchema, path)).toEqual({
        field: expectedField,
        isRequired: false,
      });
    });
    it('returns nested field as required', () => {
      const path = ['nested', 'name'];
      const expectedField = get(simpleSchema, [PROPERTIES_KEY, path[1]]);
      expect(schemaUtils.findFieldInSchema(nestedSimpleSchema, path)).toEqual({
        field: expectedField,
        isRequired: true,
      });
    });
    it('returns nested field as not required', () => {
      const path = ['nested', 'age'];
      const expectedField = get(simpleSchema, [PROPERTIES_KEY, path[1]]);
      expect(schemaUtils.findFieldInSchema(nestedSimpleSchema, path)).toEqual({
        field: expectedField,
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
