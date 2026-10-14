import type { RJSFSchema } from '@rjsf/utils';

import qualifyRootRefs from '../src/qualifyRootRefs.ts';

describe('qualifyRootRefs()', () => {
  it('names the root in every $ref local to it, and leaves the rest as they are', () => {
    const schema: RJSFSchema = {
      properties: {
        local: { $ref: '#/definitions/a' },
        absolute: { $ref: 'https://example.com/other.json#/x' },
        // A property may be called `$ref`, which holds a schema rather than a reference
        $ref: { type: 'string' },
      },
      allOf: [{ $ref: '#' }, true],
      default: 1,
    };
    expect(qualifyRootRefs(schema, 'root')).toEqual({
      properties: {
        local: { $ref: 'root#/definitions/a' },
        absolute: { $ref: 'https://example.com/other.json#/x' },
        $ref: { type: 'string' },
      },
      allOf: [{ $ref: 'root#' }, true],
      default: 1,
    });
  });
  it('copies what it qualifies', () => {
    const schema: RJSFSchema = { $ref: '#/definitions/a' };
    expect(qualifyRootRefs(schema, 'root')).not.toBe(schema);
    expect(schema).toEqual({ $ref: '#/definitions/a' });
  });
});
