import { createSchemaUtils, isMultiSelect, RJSFSchema } from '../../src';
import { TestValidatorType } from './types';

export default function isMultiSelectTest(testValidator: TestValidatorType) {
  describe('isMultiSelect()', () => {
    describe('uniqueItems is true', () => {
      describe('schema items enum is an array', () => {
        it('should be true', () => {
          const schema: RJSFSchema = {
            items: { enum: ['foo', 'bar'] },
            uniqueItems: true,
          };
          expect(isMultiSelect(testValidator, schema)).toBe(true);
        });
      });
      it('should be false if items is undefined', () => {
        const schema: RJSFSchema = {};
        expect(isMultiSelect(testValidator, schema)).toBe(false);
      });
      describe('schema items enum is not an array', () => {
        it('should be false if oneOf/anyOf is not in items schema', () => {
          const schema: RJSFSchema = { items: {}, uniqueItems: true };
          expect(isMultiSelect(testValidator, schema)).toBe(false);
        });
        it('should be false if oneOf/anyOf schemas are not all constants', () => {
          const schema: RJSFSchema = {
            items: {
              oneOf: [{ type: 'string', enum: ['Foo'] }, { type: 'string' }],
            },
            uniqueItems: true,
          };
          expect(isMultiSelect(testValidator, schema)).toBe(false);
        });
        it('should be true if oneOf/anyOf schemas are all constants', () => {
          const schema: RJSFSchema = {
            items: {
              oneOf: [
                { type: 'string', enum: ['Foo'] },
                { type: 'string', enum: ['Foo'] },
              ],
            },
            uniqueItems: true,
          };
          expect(isMultiSelect(testValidator, schema)).toBe(true);
        });
      });
      it('should retrieve reference schema definitions', () => {
        const schema: RJSFSchema = {
          definitions: {
            FooItem: { type: 'string', enum: ['foo'] },
          },
          items: { $ref: '#/definitions/FooItem' },
          uniqueItems: true,
        };
        const schemaUtils = createSchemaUtils(testValidator, schema);
        expect(schemaUtils.isMultiSelect(schema)).toBe(true);
      });
    });
    it('should be false if uniqueItems is false', () => {
      const schema: RJSFSchema = {
        items: { enum: ['foo', 'bar'] },
        uniqueItems: false,
      };
      expect(isMultiSelect(testValidator, schema)).toBe(false);
    });
  });
}
