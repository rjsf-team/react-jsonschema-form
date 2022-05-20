import { RJSFSchema, findSchemaDefinition } from '../src';

const schema: RJSFSchema = {
  type: 'object',
  definitions: {
    stringRef: {
      type: 'string'
    },
    nestedRef: {
      $ref: '#/definitions/stringRef'
    }
  }
};

describe('findSchemaDefinition()', () => {
  it('throws error when ref is malformed', () => {
    expect(() => findSchemaDefinition('definitions/missing')).toThrowError(
      'Could not find a definition for definitions/missing'
    );
  });
  it('throws error when ref does not exist', () => {
    expect(() => findSchemaDefinition('#/definitions/missing', schema)).toThrowError(
      'Could not find a definition for #/definitions/missing'
    );
  });
  it('returns the string ref from its definition', () => {
    expect(findSchemaDefinition('#/definitions/stringRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns the string ref from its nested definition', () => {
    expect(findSchemaDefinition('#/definitions/nestedRef', schema)).toBe(schema.definitions!.stringRef);
  });
});
