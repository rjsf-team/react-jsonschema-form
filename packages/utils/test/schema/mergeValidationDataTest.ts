import { ERRORS_KEY, mergeValidationData, createSchemaUtils, ErrorSchema, ValidationData } from '../../src';
import { TestValidatorType } from './types';

export default function mergeValidationDataTest(testValidator: TestValidatorType) {
  describe('mergeValidationDataTest()', () => {
    it('Returns validationData when no additionalErrorSchema is passed', () => {
      const validationData: ValidationData<any> = {
        errorSchema: {},
        errors: [],
      };
      expect(mergeValidationData(testValidator, validationData)).toBe(validationData);
    });
    it('Returns only additionalErrorSchema when additionalErrorSchema is passed and no validationData', () => {
      const validationData: ValidationData<any> = {
        errorSchema: {},
        errors: [],
      };
      const errors = ['custom errors'];
      const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
      testValidator.setReturnValues({ errorList: [customErrors] });
      const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors } as ErrorSchema;
      const expected = {
        errorSchema,
        errors: customErrors,
      };
      expect(mergeValidationData(testValidator, validationData, errorSchema)).toEqual(expected);
    });
    it('Returns merged data when additionalErrorSchema is passed', () => {
      const schemaUtils = createSchemaUtils(testValidator, {});
      const oldError = 'ajv error';
      const validationData: ValidationData<any> = {
        errorSchema: { [ERRORS_KEY]: [oldError] } as ErrorSchema,
        errors: [{ stack: oldError, name: 'foo', schemaPath: '.foo' }],
      };
      const errors = ['custom errors'];
      const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
      testValidator.setReturnValues({ errorList: [customErrors] });
      const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors } as ErrorSchema;
      const expected = {
        errorSchema: { [ERRORS_KEY]: [oldError, ...errors] },
        errors: [...validationData.errors, ...customErrors],
      };
      expect(schemaUtils.mergeValidationData(validationData, errorSchema)).toEqual(expected);
    });
  });
}
