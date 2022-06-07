import { UI_WIDGET_NAME, isFilesArray, RJSFSchema, createSchemaUtils } from '../../src';
import getTestValidator, { TestValidatorType } from '../testUtils/getTestValidator';

describe('isFilesArray()', () => {
  let testValidator: TestValidatorType;
  beforeAll(() => {
    testValidator = getTestValidator({});
  });
  it ('returns true if the uiSchema has the "files" widget', () => {
    const schema: RJSFSchema = {};
    const uiSchema = { [UI_WIDGET_NAME]: 'files' };
    expect(isFilesArray(testValidator, schema, uiSchema)).toBe(true);
  });
  it('should be true if items have data-url format', () => {
    const schema: RJSFSchema = { items: { type: 'string', format: 'data-url' } };
    const uiSchema = {};
    const schemaUtils = createSchemaUtils(testValidator, schema);
    expect(schemaUtils.isFilesArray(schema, uiSchema)).toBe(true);
  });

  it('should be false if items is undefined', () => {
    const schema: RJSFSchema = {};
    const uiSchema = {};
    expect(isFilesArray(testValidator, schema, uiSchema)).toBe(false);
  });
});
