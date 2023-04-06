import { withIdRefPrefix, RJSFSchema } from '../src';

describe('withIdRefPrefix()', () => {
  it('should recursively add id prefix to all refs', () => {
    const schema: RJSFSchema = {
      anyOf: [{ $ref: '#/defs/foo' }],
    };
    const expected = {
      anyOf: [{ $ref: '__rjsf_rootSchema#/defs/foo' }],
    };

    expect(withIdRefPrefix(schema)).toEqual(expected);
  });
  it('shouldn`t mutate the schema', () => {
    const schema: RJSFSchema = {
      anyOf: [{ $ref: '#/defs/foo' }],
    };

    withIdRefPrefix(schema);

    expect(schema).toEqual({
      anyOf: [{ $ref: '#/defs/foo' }],
    });
  });
  it('should not change a property named `$ref`', () => {
    const schema: RJSFSchema = {
      title: 'A registration form',
      description: 'A simple form example.',
      type: 'object',
      properties: {
        $ref: { type: 'string', title: 'First name', default: 'Chuck' },
      },
    };

    expect(withIdRefPrefix(schema)).toEqual(schema);
  });
});
