import {
  createSchemaUtils,
  Experimental_DefaultFormStateBehavior,
  RJSFSchema,
  SchemaUtilsType,
  ValidatorType,
} from '../src';
import getTestValidator from './testUtils/getTestValidator';

describe('createSchemaUtils()', () => {
  const testValidator: ValidatorType = getTestValidator({});
  const rootSchema: RJSFSchema = { type: 'object' };
  const defaultFormStateBehavior: Experimental_DefaultFormStateBehavior = { arrayMinItems: 'requiredOnly' };
  const schemaUtils: SchemaUtilsType = createSchemaUtils(testValidator, rootSchema, defaultFormStateBehavior);

  it('getValidator()', () => {
    expect(schemaUtils.getValidator()).toBe(testValidator);
  });

  describe('doesSchemaUtilsDiffer()', () => {
    describe('constructed without defaultFormStateBehavior', () => {
      const schemaUtils: SchemaUtilsType = createSchemaUtils(testValidator, rootSchema);

      it('returns false when not passing defaultFormStateBehavior', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, rootSchema)).toBe(false);
      });
      it('returns true when passing different defaultFormStateBehavior', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, rootSchema, { arrayMinItems: 'requiredOnly' })).toBe(
          true
        );
      });
    });

    describe('constructed with defaultFormStateBehavior', () => {
      it('returns false when passing same validator, rootSchema, and defaultFormStateBehavior', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, rootSchema, defaultFormStateBehavior)).toBe(false);
      });
      it('returns false when passing falsy validator', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer(null as unknown as ValidatorType, {}, defaultFormStateBehavior)).toBe(
          false
        );
      });
      it('returns false when passing falsy rootSchema', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer(testValidator, null as unknown as RJSFSchema, defaultFormStateBehavior)
        ).toBe(false);
      });
      it('returns true when passing different validator', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer(getTestValidator({}), {}, defaultFormStateBehavior)).toBe(true);
      });
      it('returns true when passing different rootSchema', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, {}, defaultFormStateBehavior)).toBe(true);
      });
      it('returns true when passing different defaultFormStateBehavior', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, rootSchema, { arrayMinItems: 'populate' })).toBe(true);
      });
    });
  });
  // NOTE: the rest of the functions are tested in the tests defined in the `schema` directory
});
