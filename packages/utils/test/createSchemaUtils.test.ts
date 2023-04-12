import { createSchemaUtils, RJSFSchema, SchemaUtilsType, ValidatorType } from '../src';
import getTestValidator from './testUtils/getTestValidator';

describe('createSchemaUtils()', () => {
  const testValidator: ValidatorType = getTestValidator({});
  const rootSchema: RJSFSchema = { type: 'object' };
  const behaviorBitFlags = 0;
  const schemaUtils: SchemaUtilsType = createSchemaUtils(testValidator, rootSchema, behaviorBitFlags);

  it('getValidator()', () => {
    expect(schemaUtils.getValidator()).toBe(testValidator);
  });

  describe('doesSchemaUtilsDiffer()', () => {
    it('returns false when passing same validator, rootSchema, and behaviorBitFlags', () => {
      expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, rootSchema, behaviorBitFlags)).toBe(false);
    });
    it('returns false when passing falsy validator', () => {
      expect(schemaUtils.doesSchemaUtilsDiffer(null as unknown as ValidatorType, {}, behaviorBitFlags)).toBe(false);
    });
    it('returns false when passing falsy rootSchema', () => {
      expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, null as unknown as RJSFSchema, behaviorBitFlags)).toBe(
        false
      );
    });
    it('returns true when passing different validator', () => {
      expect(schemaUtils.doesSchemaUtilsDiffer(getTestValidator({}), {}, behaviorBitFlags)).toBe(true);
    });
    it('returns true when passing different rootSchema', () => {
      expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, {}, behaviorBitFlags)).toBe(true);
    });
    it('returns true when passing different behaviorBitFlags', () => {
      expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, rootSchema, 1)).toBe(true);
    });
  });
  // NOTE: the rest of the functions are tested in the tests defined in the `schema` directory
});
