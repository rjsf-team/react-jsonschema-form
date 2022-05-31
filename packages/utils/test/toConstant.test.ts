import { toConstant } from '../src';

describe('toConstant()', () => {
  describe('schema contains an enum array', () => {
    it('should return its first value when it contains a unique element', () => {
      const schema = { enum: ['foo'] };
      expect(toConstant(schema)).toEqual('foo');
    });

    it('should return schema const value when it exists', () => {
      const schema = { const: 'bar' };
      expect(toConstant(schema)).toEqual('bar');
    });

    it('should throw when it contains more than one element', () => {
      const schema = { enum: ['foo', 'bar'] };
      expect(() => {
        toConstant(schema);
      }).toThrowError('cannot be inferred');
    });
  });
});
