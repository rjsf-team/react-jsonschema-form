/* oxlint-disable typescript/no-deprecated -- pins the deprecated wrapper kept for callers written against 6.x */
import type { RJSFSchema } from '../src/index.ts';
import { findSchemaDefinition, RJSF_REF_KEY } from '../src/index.ts';
import looseSchema from './schema/graph/looseSchema.ts';

const address: RJSFSchema = { type: 'object', properties: { city: { type: 'string' } } };

const rootSchema: RJSFSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  definitions: {
    address,
    status: { type: 'string', default: 'target' },
    aliased: { $ref: '#/definitions/status', default: 'alias' },
    constrained: { $ref: '#/definitions/address', required: ['city'] },
    anchored: looseSchema({ $anchor: 'nd', type: 'number' }),
    loopA: { $ref: '#/definitions/loopB' },
    loopB: { $ref: '#/definitions/loopA' },
  },
};

describe('findSchemaDefinition()', () => {
  it('returns the definition a JSON pointer names, marked with the $ref, decoding a percent-encoded token', () => {
    const expected = { ...address, [RJSF_REF_KEY]: '#/definitions/address' };

    expect(findSchemaDefinition('#/definitions/address', rootSchema)).toEqual(expected);
    expect(findSchemaDefinition('#/definitions/%61ddress', rootSchema)).toEqual({
      ...address,
      [RJSF_REF_KEY]: '#/definitions/%61ddress',
    });
  });

  it('follows the $refs below the target, reading the keywords beside each as the form does', () => {
    expect(findSchemaDefinition('#/definitions/aliased', rootSchema)).toEqual({
      type: 'string',
      default: 'alias',
      [RJSF_REF_KEY]: '#/definitions/aliased',
    });
    expect(findSchemaDefinition('#/definitions/constrained', rootSchema)).toEqual({
      ...address,
      required: ['city'],
      [RJSF_REF_KEY]: '#/definitions/constrained',
    });
  });

  it('resolves a $ref to an $anchor', () => {
    expect(findSchemaDefinition('#nd', rootSchema)).toEqual({
      $anchor: 'nd',
      type: 'number',
      [RJSF_REF_KEY]: '#nd',
    });
  });

  it('throws for a $ref that names nothing, and for one given no root', () => {
    expect(() => findSchemaDefinition('#/definitions/missing', rootSchema)).toThrow(
      'Could not find a definition for #/definitions/missing.',
    );
    expect(() => findSchemaDefinition('#/definitions/address')).toThrow('Could not find a definition for');
    expect(() => findSchemaDefinition(undefined, rootSchema)).toThrow('Could not find a definition for');
  });

  it('throws for a chain of $refs that loops back on itself', () => {
    expect(() => findSchemaDefinition('#/definitions/loopA', rootSchema)).toThrow(/circular reference/);
  });
});
