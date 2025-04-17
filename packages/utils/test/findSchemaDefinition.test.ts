import { RJSFSchema, findSchemaDefinition } from '../src';
import { findSchemaDefinitionRecursive } from '../src/findSchemaDefinition';

const schema: RJSFSchema = {
  type: 'object',
  definitions: {
    stringRef: {
      type: 'string',
    },
    nestedRef: {
      $ref: '#/definitions/stringRef',
    },
    extraNestedRef: {
      $ref: '#/definitions/stringRef',
      title: 'foo',
    },
    // Reference accidentally pointing to itself.
    badCircularNestedRef: {
      $ref: '#/definitions/badCircularNestedRef',
    },
    // Reference accidentally pointing to a chain of references which ultimately
    // point back to the original reference.
    badCircularDeepNestedRef: {
      $ref: '#/definitions/badCircularDeeperNestedRef',
    },
    badCircularDeeperNestedRef: {
      $ref: '#/definitions/badCircularDeepestNestedRef',
    },
    badCircularDeepestNestedRef: {
      $ref: '#/definitions/badCircularDeepNestedRef',
    },
  },
};

const EXTRA_EXPECTED = { type: 'string', title: 'foo' };

describe('findSchemaDefinition()', () => {
  it('throws error when ref is missing', () => {
    expect(() => findSchemaDefinition()).toThrowError('Could not find a definition for undefined');
  });
  it('throws error when ref is malformed', () => {
    expect(() => findSchemaDefinition('definitions/missing')).toThrowError(
      'Could not find a definition for definitions/missing',
    );
  });
  it('throws error when ref does not exist', () => {
    expect(() => findSchemaDefinition('#/definitions/missing', schema)).toThrowError(
      'Could not find a definition for #/definitions/missing',
    );
  });
  it('returns the string ref from its definition', () => {
    expect(findSchemaDefinition('#/definitions/stringRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns the string ref from its nested definition', () => {
    expect(findSchemaDefinition('#/definitions/nestedRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns a combined schema made from its nested definition with the extra props', () => {
    expect(findSchemaDefinition('#/definitions/extraNestedRef', schema)).toEqual(EXTRA_EXPECTED);
  });
  it('throws error when ref is a circular reference', () => {
    expect(() => findSchemaDefinition('#/definitions/badCircularNestedRef', schema)).toThrowError(
      'Definition for #/definitions/badCircularNestedRef is a circular reference',
    );
  });
  it('throws error when ref is a deep circular reference', () => {
    expect(() => findSchemaDefinition('#/definitions/badCircularDeepNestedRef', schema)).toThrowError(
      'Definition for #/definitions/badCircularDeepNestedRef contains a circular reference through #/definitions/badCircularDeeperNestedRef -> #/definitions/badCircularDeepestNestedRef -> #/definitions/badCircularDeepNestedRef',
    );
  });
});

describe('findSchemaDefinitionRecursive()', () => {
  it('throws error when ref is missing', () => {
    expect(() => findSchemaDefinitionRecursive()).toThrowError('Could not find a definition for undefined');
  });
  it('throws error when ref is malformed', () => {
    expect(() => findSchemaDefinitionRecursive('definitions/missing')).toThrowError(
      'Could not find a definition for definitions/missing',
    );
  });
  it('throws error when ref does not exist', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/missing', schema)).toThrowError(
      'Could not find a definition for #/definitions/missing',
    );
  });
  it('returns the string ref from its definition', () => {
    expect(findSchemaDefinitionRecursive('#/definitions/stringRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns the string ref from its nested definition', () => {
    expect(findSchemaDefinitionRecursive('#/definitions/nestedRef', schema)).toBe(schema.definitions!.stringRef);
  });
  it('returns a combined schema made from its nested definition with the extra props', () => {
    expect(findSchemaDefinitionRecursive('#/definitions/extraNestedRef', schema)).toEqual(EXTRA_EXPECTED);
  });
  it('throws error when ref is a circular reference', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/badCircularNestedRef', schema)).toThrowError(
      'Definition for #/definitions/badCircularNestedRef is a circular reference',
    );
  });
  it('throws error when ref is a deep circular reference', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/badCircularDeepNestedRef', schema)).toThrowError(
      'Definition for #/definitions/badCircularDeepNestedRef contains a circular reference through #/definitions/badCircularDeeperNestedRef -> #/definitions/badCircularDeepestNestedRef -> #/definitions/badCircularDeepNestedRef',
    );
  });
});
