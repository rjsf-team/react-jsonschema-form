import { RJSFSchema } from 'src';
import constIsAjvDataReference from '../src/constIsAjvDataReference';

describe('constIsAjvDataReference()', () => {
  describe('check if schema contains $data reference', () => {
    it('should return true when the const property contains a $data reference', () => {
      const schema: RJSFSchema = {
        type: 'string',
        const: {
          $data: '/email',
        },
        title: 'Confirm e-mail',
        format: 'email',
      };
      expect(constIsAjvDataReference(schema)).toEqual(true);
    });

    it('should return false when the const property does not contain a $data reference', () => {
      const schema: RJSFSchema = {
        type: 'string',
        const: 'hello world',
      };
      expect(constIsAjvDataReference(schema)).toEqual(false);
    });

    it('Should return false when the const property is not present in the schema', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      expect(constIsAjvDataReference(schema)).toEqual(false);
    });

    it('Should return false when the $data reference is at the object level.', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          $data: {
            type: 'string',
          },
        },
        const: {
          $data: 'Hello World!',
        },
      };
      expect(constIsAjvDataReference(schema)).toEqual(false);
    });

    it('should return false when the schema is invalid', () => {
      const schema = 'hello world' as unknown as RJSFSchema;
      expect(constIsAjvDataReference(schema)).toEqual(false);
    });
  });
});
