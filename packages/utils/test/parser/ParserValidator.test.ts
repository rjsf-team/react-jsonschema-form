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
const DUPLICATE_SCHEMA = {
  title: 'duplicate',
};
const RECURSIVE_HASH = hashForSchema(RECURSIVE_REF);
const TINY_HASH = hashForSchema(TINY_SCHEMA);
const DUPLICATE_HASH = hashForSchema(DUPLICATE_SCHEMA);

describe('ParserValidator', () => {
  let validator: ParserValidator;
  let consoleErrorSpy: jest.SpyInstance;
  beforeAll(() => {
    validator = new ParserValidator(RECURSIVE_REF);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
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
  it('calling isValid() with TINY_SCHEMA returns false', () => {
    expect(validator.isValid(TINY_SCHEMA, undefined, RECURSIVE_REF)).toBe(false);
  });
  it('the TINY_SCHEMA was added to the map, with the hash injected as the ID_KEY', () => {
    expect(validator.getSchemaMap()).toEqual({
      [RECURSIVE_HASH]: { ...RECURSIVE_REF, [ID_KEY]: RECURSIVE_HASH },
      [TINY_HASH]: { ...TINY_SCHEMA, [ID_KEY]: TINY_HASH },
    });
  });
  it('calling isValid() with ID_SCHEMA returns false', () => {
    expect(validator.isValid(ID_SCHEMA, undefined, RECURSIVE_REF)).toBe(false);
  });
  it('the ID_SCHEMA was added to the map without injecting the hash because it has an ID', () => {
    expect(validator.getSchemaMap()).toEqual({
      [RECURSIVE_HASH]: { ...RECURSIVE_REF, [ID_KEY]: RECURSIVE_HASH },
      [TINY_HASH]: { ...TINY_SCHEMA, [ID_KEY]: TINY_HASH },
      [ID_HASH]: ID_SCHEMA,
    });
  });
  it('calling isValid() with a schema that has a matching key throws error', () => {
    // Force the error condition
    validator.schemaMap[DUPLICATE_HASH] = TINY_SCHEMA;
    expect(() => validator.isValid(DUPLICATE_SCHEMA, undefined, RECURSIVE_REF)).toThrowError(
      new Error(
        `Two different schemas exist with the same key ${DUPLICATE_HASH}! What a bad coincidence. If possible, try adding an $id to one of the schemas`
      )
    );
  });
  it('when exception is thrown, console.error is called twice', () => {
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
  });
  it('the first shows the existing schema', () => {
    expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'existing schema:', JSON.stringify(TINY_SCHEMA, null, 2));
  });
  it('the second shows the new schema', () => {
    expect(consoleErrorSpy).toHaveBeenNthCalledWith(
      2,
      'new schema:',
      JSON.stringify({ ...DUPLICATE_SCHEMA, [ID_KEY]: DUPLICATE_HASH }, null, 2)
    );
  });
});
