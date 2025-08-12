import { findSchemaDefinition, ID_KEY, RJSFSchema } from '../src';
import { findSchemaDefinitionRecursive, makeAllReferencesAbsolute } from '../src/findSchemaDefinition';

const schema: RJSFSchema = {
  type: 'object',
  definitions: {
    bundledSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/bundled.ref.json',
      type: 'object',
      properties: {
        num: {
          type: 'integer',
        },
      },
    },
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
    // Bundled references are supported only within JSON Schema Draft 2020-12
    bundledRef: {
      $ref: '/bundled.ref.json',
    },
  },
};

const internalSchema: RJSFSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/bundled.ref.json',
  type: 'object',
  $defs: {
    colors: {
      type: 'string',
      enum: ['red', 'green', 'blue'],
    },
    string: {
      type: 'string',
    },
    circularRef: {
      $ref: '/bundled.schema.json/#/$defs/circularRef',
    },
    undefinedRef: {
      $ref: '#/$defs/undefined',
    },
  },
  properties: {
    num: {
      type: 'integer',
    },
    string: {
      $ref: '#/$defs/string',
    },
    allOf: {
      allOf: [
        {
          $ref: '#/$defs/string',
        },
        {
          title: 'String',
        },
      ],
    },
  },
};

const bundledSchema: RJSFSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  $id: 'https://example.com/bundled.schema.json',
  $defs: {
    bundledSchema: internalSchema,
    bundledSchemaArray: {
      anyOf: [
        {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.array.1.json',
          type: 'object',
        },
        {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.array.2.json',
          type: 'object',
        },
      ],
    },
    bundledAbsoluteRef: {
      $ref: 'https://example.com/bundled.ref.json',
    },
    bundledAbsoluteRefWithAnchor: {
      $ref: 'https://example.com/bundled.ref.json/#/properties/num',
    },
    bundledAbsoluteRefWithinArray: {
      $ref: 'https://example.com/bundled.ref.array.1.json',
    },
    bundledRelativeRef: {
      $ref: '/bundled.ref.json',
    },
    bundledRelativeRefWithAnchor: {
      $ref: '/bundled.ref.json/#/properties/string',
    },
    circularRef: {
      $ref: '/bundled.ref.json/#/$defs/circularRef',
    },
    indirectRef: {
      $ref: '#/$defs/bundledAbsoluteRef',
    },
    undefinedRef: {
      $ref: '/undefined.ref.json',
    },
    undefinedRefWithAnchor: {
      $ref: '/bundled.ref.json#/$defs/undefinedRef',
    },
  },
  properties: {
    undefined: {
      type: 'null',
    },
  },
};

const EXTRA_EXPECTED = { type: 'string', title: 'foo' };

describe('findSchemaDefinition()', () => {
  it('throws error when ref is missing', () => {
    expect(() => findSchemaDefinition()).toThrow('Could not find a definition for undefined');
  });
  it('throws error when ref is malformed', () => {
    expect(() => findSchemaDefinition('definitions/missing')).toThrow(
      'Could not find a definition for definitions/missing',
    );
  });
  it('throws error when ref does not exist', () => {
    expect(() => findSchemaDefinition('#/definitions/missing', schema)).toThrow(
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
    expect(() => findSchemaDefinition('#/definitions/badCircularNestedRef', schema)).toThrow(
      'Definition for #/definitions/badCircularNestedRef is a circular reference',
    );
  });
  it('throws error when ref is a deep circular reference', () => {
    expect(() => findSchemaDefinition('#/definitions/badCircularDeepNestedRef', schema)).toThrow(
      'Definition for #/definitions/badCircularDeepNestedRef contains a circular reference through #/definitions/badCircularDeeperNestedRef -> #/definitions/badCircularDeepestNestedRef -> #/definitions/badCircularDeepNestedRef',
    );
  });
  it('throws error when bundled ref are not part of JSON Schema Draft 2020-12', () => {
    expect(() => findSchemaDefinition('#/definitions/bundledRef', schema)).toThrow(
      'Could not find a definition for /bundled.ref.json',
    );
  });
  it('throws error when bundled ref with explicit baseURI are not part of JSON Schema Draft 2020-12', () => {
    expect(() => findSchemaDefinition('#/properties/num', schema, 'https://example.com/bundled.ref.json')).toThrow(
      'Could not find a definition for #/properties/num',
    );
  });
  it('correctly resolves absolute bundled refs when JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledAbsoluteRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves absolute bundled refs with anchors within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledAbsoluteRefWithAnchor', bundledSchema)).toBe(
      internalSchema.properties!.num,
    );
  });
  it('correctly resolves absolute bundled refs in arrays within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledAbsoluteRefWithinArray', bundledSchema)).toBe(
      (bundledSchema.$defs!.bundledSchemaArray as RJSFSchema).anyOf![0],
    );
  });
  it('correctly resolves absolute bundled refs within a JSON Schema Draft 2020-12 without an `$id`', () => {
    const { $id: d, ...bundledSchemaWithoutId } = bundledSchema;
    expect(findSchemaDefinition('#/$defs/bundledAbsoluteRef', bundledSchemaWithoutId)).toStrictEqual(internalSchema);
  });
  it('correctly resolves relative bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledRelativeRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves relative bundled refs with anchors within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/bundledRelativeRefWithAnchor', bundledSchema)).toBe(
      internalSchema.$defs!.string,
    );
  });
  it('correctly resolves indirect bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinition('#/$defs/indirectRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves refs with explicit base URI in a bundled JSON Schema', () => {
    expect(
      findSchemaDefinition('bundled.ref.json', bundledSchema, 'https://example.com/undefined.ref.json'),
    ).toStrictEqual(internalSchema);
  });
  it('correctly resolves local refs with explicit base URI in a bundled JSON Schema', () => {
    expect(findSchemaDefinition('#/properties/num', bundledSchema, 'https://example.com/bundled.ref.json')).toBe(
      internalSchema.properties!.num,
    );
  });
  it('throws error when relative ref is undefined in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinition('#/$defs/undefinedRef', bundledSchema)).toThrow(
      'Could not find a definition for /undefined.ref.json',
    );
  });
  it('throws error when relative ref with anchor is undefined in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinition('#/$defs/undefinedRefWithAnchor', bundledSchema)).toThrow(
      'Could not find a definition for #/$defs/undefined',
    );
  });
  it('throws error when local ref is undefined in a bundled JSON Schema with explicit base URI', () => {
    expect(() =>
      findSchemaDefinition('#/properties/undefined', bundledSchema, 'https://example.com/bundled.ref.json'),
    ).toThrow('Could not find a definition for #/properties/undefined');
  });
  it('throws error when explicit base URI is undefined in a bundled JSON Schema', () => {
    expect(() =>
      findSchemaDefinition('#/properties/undefined', bundledSchema, 'https://example.com/undefined.ref.json'),
    ).toThrow('Could not find a definition for #/properties/undefined');
  });
  it('throws error when ref is a deep circular reference in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinition('#/$defs/circularRef', bundledSchema)).toThrow(
      'Definition for #/$defs/circularRef contains a circular reference through /bundled.ref.json/#/$defs/circularRef -> /bundled.schema.json/#/$defs/circularRef -> #/$defs/circularRef',
    );
  });
});

describe('findSchemaDefinitionRecursive()', () => {
  it('throws error when ref is missing', () => {
    expect(() => findSchemaDefinitionRecursive()).toThrow('Could not find a definition for undefined');
  });
  it('throws error when ref is malformed', () => {
    expect(() => findSchemaDefinitionRecursive('definitions/missing')).toThrow(
      'Could not find a definition for definitions/missing',
    );
  });
  it('throws error when ref does not exist', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/missing', schema)).toThrow(
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
    expect(() => findSchemaDefinitionRecursive('#/definitions/badCircularNestedRef', schema)).toThrow(
      'Definition for #/definitions/badCircularNestedRef is a circular reference',
    );
  });
  it('throws error when ref is a deep circular reference', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/badCircularDeepNestedRef', schema)).toThrow(
      'Definition for #/definitions/badCircularDeepNestedRef contains a circular reference through #/definitions/badCircularDeeperNestedRef -> #/definitions/badCircularDeepestNestedRef -> #/definitions/badCircularDeepNestedRef',
    );
  });
  it('throws error when bundled ref are not part of JSON Schema Draft 2020-12', () => {
    expect(() => findSchemaDefinitionRecursive('#/definitions/bundledRef', schema)).toThrow(
      'Could not find a definition for /bundled.ref.json',
    );
  });
  it('throws error when bundled ref with explicit baseURI are not part of JSON Schema Draft 2020-12', () => {
    expect(() =>
      findSchemaDefinitionRecursive('#/properties/num', schema, [], 'https://example.com/bundled.ref.json'),
    ).toThrow('Could not find a definition for #/properties/num');
  });
  it('correctly resolves absolute bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledAbsoluteRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves absolute bundled refs with anchors within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledAbsoluteRefWithAnchor', bundledSchema)).toBe(
      internalSchema.properties!.num,
    );
  });
  it('correctly resolves absolute bundled refs in arrays within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledAbsoluteRefWithinArray', bundledSchema)).toBe(
      (bundledSchema.$defs!.bundledSchemaArray as RJSFSchema).anyOf![0],
    );
  });
  it('correctly resolves absolute bundled refs within a JSON Schema Draft 2020-12 without an `$id`', () => {
    const { $id: d, ...bundledSchemaWithoutId } = bundledSchema;
    expect(findSchemaDefinitionRecursive('#/$defs/bundledAbsoluteRef', bundledSchemaWithoutId)).toStrictEqual(
      internalSchema,
    );
  });
  it('correctly resolves relative bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledRelativeRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves relative bundled refs with anchors within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/bundledRelativeRefWithAnchor', bundledSchema)).toBe(
      internalSchema.$defs!.string,
    );
  });
  it('correctly resolves indirect bundled refs within a JSON Schema Draft 2020-12', () => {
    expect(findSchemaDefinitionRecursive('#/$defs/indirectRef', bundledSchema)).toStrictEqual(internalSchema);
  });
  it('correctly resolves relative refs with explicit base URI in a bundled JSON Schema', () => {
    expect(
      findSchemaDefinitionRecursive('bundled.ref.json', bundledSchema, [], 'https://example.com/undefined.ref.json'),
    ).toStrictEqual(internalSchema);
  });
  it('correctly resolves local refs with explicit base URI in a bundled JSON Schema', () => {
    expect(
      findSchemaDefinitionRecursive('#/properties/num', bundledSchema, [], 'https://example.com/bundled.ref.json'),
    ).toBe(internalSchema.properties!.num);
  });
  it('throws error when relative ref is undefined in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinitionRecursive('#/$defs/undefinedRef', bundledSchema)).toThrow(
      'Could not find a definition for /undefined.ref.json',
    );
  });
  it('throws error when relative ref with anchor is undefined in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinitionRecursive('#/$defs/undefinedRefWithAnchor', bundledSchema)).toThrow(
      'Could not find a definition for #/$defs/undefined',
    );
  });
  it('throws error when local ref is undefined in a bundled JSON Schema with explicit base URI', () => {
    expect(() =>
      findSchemaDefinitionRecursive(
        '#/properties/undefined',
        bundledSchema,
        [],
        'https://example.com/bundled.ref.json',
      ),
    ).toThrow('Could not find a definition for #/properties/undefined');
  });
  it('throws error when explicit base URI is undefined in a bundled JSON Schema', () => {
    expect(() =>
      findSchemaDefinition('#/properties/undefined', bundledSchema, 'https://example.com/undefined.ref.json'),
    ).toThrow('Could not find a definition for #/properties/undefined');
  });
  it('throws error when ref is a deep circular reference in a bundled JSON Schema', () => {
    expect(() => findSchemaDefinitionRecursive('#/$defs/circularRef', bundledSchema, [])).toThrow(
      'Definition for #/$defs/circularRef contains a circular reference through /bundled.ref.json/#/$defs/circularRef -> /bundled.schema.json/#/$defs/circularRef -> #/$defs/circularRef',
    );
  });
});

describe('makeAllReferencesAbsolute()', () => {
  it('correctly makes all references absolute in a JSON Schema', () => {
    expect(makeAllReferencesAbsolute(internalSchema, internalSchema[ID_KEY]!)).toStrictEqual({
      ...internalSchema,
      $defs: {
        ...internalSchema.$defs,
        circularRef: { $ref: 'https://example.com/bundled.schema.json/#/$defs/circularRef' },
        undefinedRef: { $ref: 'https://example.com/bundled.ref.json#/$defs/undefined' },
      },
      properties: {
        ...internalSchema.properties,
        string: { $ref: 'https://example.com/bundled.ref.json#/$defs/string' },
        allOf: {
          allOf: [
            {
              $ref: 'https://example.com/bundled.ref.json#/$defs/string',
            },
            {
              title: 'String',
            },
          ],
        },
      },
    });
  });
});
