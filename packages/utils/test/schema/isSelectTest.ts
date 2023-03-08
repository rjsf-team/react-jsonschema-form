import { createSchemaUtils, isSelect, RJSFSchema } from '../../src';
import { TestValidatorType } from './types';

export default function isSelectTest(testValidator: TestValidatorType) {
  describe('isSelect()', () => {
    it('should be false if items is undefined', () => {
      const schema: RJSFSchema = {};
      expect(isSelect(testValidator, schema)).toBe(false);
    });
    describe('schema items enum is not an array', () => {
      it('should be false if oneOf/anyOf schemas are not all constants', () => {
        const schema: RJSFSchema = {
          anyOf: [{ type: 'string', enum: ['Foo'] }, { type: 'string' }],
        };
        expect(isSelect(testValidator, schema)).toBe(false);
      });
      it('should be true if oneOf/anyOf schemas are all constants', () => {
        const schema: RJSFSchema = {
          oneOf: [
            { type: 'string', enum: ['Foo'] },
            { type: 'string', enum: ['Foo'] },
          ],
        };
        expect(isSelect(testValidator, schema)).toBe(true);
      });
    });
    it('should retrieve reference schema definitions', () => {
      const schema: RJSFSchema = {
        definitions: {
          FooItem: { type: 'string', enum: ['foo'] },
        },
        $ref: '#/definitions/FooItem',
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);
      expect(schemaUtils.isSelect(schema)).toBe(true);
    });
  });
}
