import { createSchemaUtils, getMatchingOption, RJSFSchema } from '../../src';
import getTestValidator, { TestValidatorType } from '../testUtils/getTestValidator';

describe('getMatchingOption(testValidator, )', () => {
  let testValidator: TestValidatorType;
  beforeAll(() => {
    testValidator = getTestValidator({});
  });
  it('should infer correct anyOf schema based on data if passing undefined', () => {
    const rootSchema = {
      defs: {
        a: { type: 'object', properties: { id: { enum: ['a'] } } },
        nested: {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/defs/any' },
          },
        },
        any: { anyOf: [{ $ref: '#/defs/a' }, { $ref: '#/defs/nested' }] },
      },
      $ref: '#/defs/any',
    };
    const options: RJSFSchema[] = [
      { type: 'object', properties: { id: { enum: ['a'] } } },
      {
        type: 'object',
        properties: {
          id: { enum: ['nested'] },
          child: { $ref: '#/defs/any' },
        },
      },
    ];
    expect(getMatchingOption(testValidator, undefined, options, rootSchema)).toEqual(0);
  });
  it('returns 0 if no options match', () => {
    testValidator.setReturnValues({ isValid: [false, false, false] });
    const rootSchema = {
      defs: {
        a: { type: 'object', properties: { id: { enum: ['a'] } } },
        nested: {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/defs/any' },
          },
        },
        any: { anyOf: [{ $ref: '#/defs/a' }, { $ref: '#/defs/nested' }] },
      },
      $ref: '#/defs/any',
    };
    const options: RJSFSchema[] = [
      { type: 'string' },
      { type: 'string' },
      { type: 'null' },
    ];
    expect(getMatchingOption(testValidator, null, options, rootSchema)).toEqual(0);
  });
  it('should infer correct anyOf schema based on data if passing null and option 2 is {type: null}', () => {
    testValidator.setReturnValues({ isValid: [false, false, true] });
    const rootSchema = {
      defs: {
        a: { type: 'object', properties: { id: { enum: ['a'] } } },
        nested: {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/defs/any' },
          },
        },
        any: { anyOf: [{ $ref: '#/defs/a' }, { $ref: '#/defs/nested' }] },
      },
      $ref: '#/defs/any',
    };
    const options: RJSFSchema[] = [
      { type: 'string' },
      { type: 'string' },
      { type: 'null' },
    ];
    expect(getMatchingOption(testValidator, null, options, rootSchema)).toEqual(2);
  });
  it('should infer correct anyOf schema based on data', () => {
    testValidator.setReturnValues({ isValid: [false, true] });
    const rootSchema = {
      defs: {
        a: { type: 'object', properties: { id: { enum: ['a'] } } },
        nested: {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/defs/any' },
          },
        },
        any: { anyOf: [{ $ref: '#/defs/a' }, { $ref: '#/defs/nested' }] },
      },
      $ref: '#/defs/any',
    };
    const options: RJSFSchema[] = [
      { type: 'object', properties: { id: { enum: ['a'] } } },
      {
        type: 'object',
        properties: {
          id: { enum: ['nested'] },
          child: { $ref: '#/defs/any' },
        },
      },
    ];
    const formData = {
      id: 'nested',
      child: {
        id: 'nested',
        child: {
          id: 'a',
        },
      },
    };
    const schemaUtils = createSchemaUtils(testValidator, rootSchema);
    expect(schemaUtils.getMatchingOption(formData, options)).toEqual(1);
  });
});
