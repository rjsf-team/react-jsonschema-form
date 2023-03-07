import { UI_WIDGET_KEY, isFilesArray, RJSFSchema, createSchemaUtils } from '../../src';
import { TestValidatorType } from './types';

export default function isFilesArrayTest(testValidator: TestValidatorType) {
  describe('isFilesArray()', () => {
    it('returns true if the uiSchema has the "files" widget', () => {
      const schema: RJSFSchema = {};
      const uiSchema = { [UI_WIDGET_KEY]: 'files' };
      expect(isFilesArray(testValidator, schema, uiSchema)).toBe(true);
    });
    it('should be true if items have data-url format', () => {
      const schema: RJSFSchema = {
        items: { type: 'string', format: 'data-url' },
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);
      expect(schemaUtils.isFilesArray(schema)).toBe(true);
    });
    it('should be false if items is undefined', () => {
      const schema: RJSFSchema = {};
      expect(isFilesArray(testValidator, schema)).toBe(false);
    });
  });
}
