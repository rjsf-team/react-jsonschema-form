import getOptionMatchingSimpleDiscriminator from '../src/getOptionMatchingSimpleDiscriminator';

describe('getOptionMatchingSimpleDiscriminator()', () => {
  describe('returns undefined if no option matches discriminator', () => {
    test('no options with no data', () => {
      expect(getOptionMatchingSimpleDiscriminator({}, [], 'id')).toEqual(undefined);
    });

    test('no options with data', () => {
      expect(getOptionMatchingSimpleDiscriminator({ foo: 'foo' }, [], 'id')).toEqual(undefined);
    });

    test('options with no data', () => {
      expect(
        getOptionMatchingSimpleDiscriminator({}, [{ type: 'object', properties: { foo: { const: 'foo' } } }], 'id'),
      ).toEqual(undefined);
    });

    test('matching property, but no discriminatorField', () => {
      expect(
        getOptionMatchingSimpleDiscriminator({ foo: 'foo' }, [
          { type: 'object', properties: { foo: { const: 'foo' } } },
        ]),
      ).toEqual(undefined);
    });

    test('matching property different from discriminatorField', () => {
      expect(
        getOptionMatchingSimpleDiscriminator(
          { foo: 'foo' },
          [{ type: 'object', properties: { foo: { const: 'foo' } } }],
          'bar',
        ),
      ).toEqual(undefined);
    });
  });

  describe('returns option index if option matches discriminator', () => {
    test('const discriminator', () => {
      expect(
        getOptionMatchingSimpleDiscriminator(
          { foo: 'foo' },
          [{}, { type: 'object', properties: { foo: { const: 'foo' } } }],
          'foo',
        ),
      ).toEqual(1);
    });

    test('enum discriminator', () => {
      expect(
        getOptionMatchingSimpleDiscriminator(
          { foo: 'foo' },
          [{}, { type: 'object', properties: { foo: { enum: ['bar', 'foo'] } } }],
          'foo',
        ),
      ).toEqual(1);
    });
  });

  describe('unsupported (non-simple) discriminator returns undefined', () => {
    test('object discriminator', () => {
      expect(
        getOptionMatchingSimpleDiscriminator(
          { foo: 'foo' },
          [{}, { type: 'object', properties: { foo: { type: 'object' } } }],
          'foo',
        ),
      ).toEqual(undefined);
    });

    test('array discriminator', () => {
      expect(
        getOptionMatchingSimpleDiscriminator(
          { foo: 'foo' },
          [{}, { type: 'object', properties: { foo: { type: 'array' } } }],
          'foo',
        ),
      ).toEqual(undefined);
    });
  });
});
