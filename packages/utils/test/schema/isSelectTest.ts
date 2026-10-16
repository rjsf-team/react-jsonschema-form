import type { RJSFSchema } from '../../src/index.ts';
import { createSchemaUtils, isSelect } from '../../src/index.ts';
import type { TestValidatorType } from './types.ts';

export default function isSelectTest(testValidator: TestValidatorType) {
  describe('isSelect()', () => {
    it('should be false if items is undefined', () => {
      const schema: RJSFSchema = {};
      expect(isSelect({ validator: testValidator }, schema)).toBe(false);
    });
    describe('schema items enum is not an array', () => {
      it('should be false if oneOf/anyOf schemas are not all constants', () => {
        const schema: RJSFSchema = {
          anyOf: [{ type: 'string', enum: ['Foo'] }, { type: 'string' }],
        };
        expect(isSelect({ validator: testValidator }, schema)).toBe(false);
      });
      it('should be true if oneOf/anyOf schemas are all constants', () => {
        const schema: RJSFSchema = {
          oneOf: [
            { type: 'string', enum: ['Foo'] },
            { type: 'string', enum: ['Foo'] },
          ],
        };
        expect(isSelect({ validator: testValidator }, schema)).toBe(true);
      });
    });
    describe('schema has both anyOf and oneOf', () => {
      it('should be false when the anyOf options are not all constants', () => {
        const schema: RJSFSchema = {
          type: 'string',
          anyOf: [{ minLength: 1 }],
          oneOf: [{ const: 'a' }, { const: 'b' }],
        };
        expect(isSelect({ validator: testValidator }, schema)).toBe(false);
      });
      it('should be true when only the anyOf options are all constants', () => {
        const schema: RJSFSchema = {
          type: 'string',
          anyOf: [{ const: 'a' }, { const: 'b' }],
          oneOf: [{ minLength: 1 }],
        };
        expect(isSelect({ validator: testValidator }, schema)).toBe(true);
      });
    });
    it('should retrieve reference schema definitions', () => {
      const schema: RJSFSchema = {
        definitions: {
          FooItem: { type: 'string', enum: ['foo'] },
        },
        $ref: '#/definitions/FooItem',
      };
      const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
      expect(schemaUtils.isSelect(schema)).toBe(true);
    });
    it('should be true for constant options written as $refs', () => {
      const color: RJSFSchema = { oneOf: [{ $ref: '#/definitions/red' }, { $ref: '#/definitions/blue' }] };
      const rootSchema: RJSFSchema = {
        definitions: { red: { const: 'red' }, blue: { const: 'blue' } },
        type: 'object',
        properties: { color },
      };
      const schemaUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
      expect(schemaUtils.isSelect(color)).toBe(true);
    });
    it('should be false for options written as $refs whose definitions are not all constants', () => {
      const color: RJSFSchema = { oneOf: [{ $ref: '#/definitions/red' }, { $ref: '#/definitions/text' }] };
      const rootSchema: RJSFSchema = {
        definitions: { red: { const: 'red' }, text: { type: 'string' } },
        type: 'object',
        properties: { color },
      };
      const schemaUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
      expect(schemaUtils.isSelect(color)).toBe(false);
    });
    it.each([undefined, 'https://json-schema.org/draft/2020-12/schema'])(
      'under %s, should be true for constant options written as $refs beside only annotations',
      ($schema) => {
        const color: RJSFSchema = {
          type: 'string',
          oneOf: [{ $ref: '#/$defs/red', title: 'Red' }, { const: 'green' }],
        };
        const rootSchema: RJSFSchema = {
          ...($schema === undefined ? {} : { $schema }),
          $defs: { red: { const: 'red' } },
          type: 'object',
          properties: { color },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
        expect(schemaUtils.isSelect(color)).toBe(true);
      },
    );
  });
}
