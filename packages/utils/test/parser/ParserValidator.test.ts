import { hashForSchema, ID_KEY, RJSFSchema } from '../../src';
import ParserValidator from '../../src/parser/ParserValidator';
import { RECURSIVE_REF } from '../testUtils/testData';

const TINY_SCHEMA: RJSFSchema = {
  type: 'string',
  title: 'test',
};
const ID_HASH = 'foo';
const ID_SCHEMA: RJSFSchema = {
  type: 'number',
  [ID_KEY]: ID_HASH,
};
const RECURSIVE_HASH = hashForSchema(RECURSIVE_REF);
const TINY_HASH = hashForSchema(TINY_SCHEMA);

describe('ParserValidator', () => {
  let validator: ParserValidator;
  beforeAll(() => {
    validator = new ParserValidator(RECURSIVE_REF);
  });
  it('map after construction, contains the rootSchema with the hash injected as the ID_KEY', () => {
    expect(validator.getSchemaMap()).toEqual({
      [RECURSIVE_HASH]: { ...RECURSIVE_REF, [ID_KEY]: RECURSIVE_HASH },
    });
  });
  it('isValid() throws error when rootSchema differs', () => {
    expect(() => validator.isValid(TINY_SCHEMA, undefined, ID_SCHEMA)).toThrowError(
      new Error('Unexpectedly calling isValid() with a rootSchema that differs from the construction rootSchema')
    );
  });
  it('rawValidation() throws error when called', () => {
    expect(() => validator.rawValidation(TINY_SCHEMA, undefined)).toThrowError(
      new Error('Unexpectedly calling the `rawValidation()` method during schema parsing')
    );
  });
  it('toErrorList() throws error when called', () => {
    expect(() => validator.toErrorList({})).toThrowError(
      new Error('Unexpectedly calling the `toErrorList()` method during schema parsing')
    );
  });
  it('validateFormData() throws error when called', () => {
    expect(() => validator.validateFormData({}, TINY_SCHEMA)).toThrowError(
      new Error('Unexpectedly calling the `validateFormData()` method during schema parsing')
    );
  });
  it('calling isValid() with TINY_SCHEMA, without setting explicit return value returns false', () => {
    expect(validator.isValid(TINY_SCHEMA, undefined, RECURSIVE_REF)).toBe(false);
  });
  it('the TINY_SCHEMA was added to the map, with the hash injected as the ID_KEY', () => {
    expect(validator.getSchemaMap()).toEqual({
      [RECURSIVE_HASH]: { ...RECURSIVE_REF, [ID_KEY]: RECURSIVE_HASH },
      [TINY_HASH]: { ...TINY_SCHEMA, [ID_KEY]: TINY_HASH },
    });
  });
  it('calling isValid() will shift out and return the first isValidReturn value', () => {
    expect(validator.isValid(ID_SCHEMA, undefined, RECURSIVE_REF)).toBe(false);
  });
  it('the ID_SCHEMA was added to the map without injecting the hash because it has an ID', () => {
    expect(validator.getSchemaMap()).toEqual({
      [RECURSIVE_HASH]: { ...RECURSIVE_REF, [ID_KEY]: RECURSIVE_HASH },
      [TINY_HASH]: { ...TINY_SCHEMA, [ID_KEY]: TINY_HASH },
      [ID_HASH]: ID_SCHEMA,
    });
  });
});
