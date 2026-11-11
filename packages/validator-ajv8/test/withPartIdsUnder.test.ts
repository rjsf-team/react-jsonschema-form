import type { RJSFSchema } from '@rjsf/utils';
import { SHARED_COPY_ID } from '@rjsf/utils';

import withPartIdsUnder from '../src/withPartIdsUnder.ts';

describe('withPartIdsUnder()', () => {
  const part = `${SHARED_COPY_ID}h`;
  const schema: RJSFSchema = {
    allOf: [{ properties: { a: { $ref: part } } }],
    definitions: {
      h: { $id: part, type: 'string' },
      other: { $id: 'other.json' },
      plain: { type: 'number' },
      no: false,
    },
    $defs: { h: { $id: part, type: 'string' } },
    properties: { kept: { $id: part } },
  };
  it('leaves a schema as it is for an Ajv reading $id', () => {
    expect(withPartIdsUnder(schema, '$id')).toBe(schema);
  });
  it("identifies by id only the parts of a scoring target's definitions and $defs that a scoring copy names", () => {
    expect(withPartIdsUnder(schema, 'id')).toEqual({
      ...schema,
      definitions: {
        h: { id: part, type: 'string' },
        other: { $id: 'other.json' },
        plain: { type: 'number' },
        no: false,
      },
      $defs: { h: { id: part, type: 'string' } },
    });
  });
});
