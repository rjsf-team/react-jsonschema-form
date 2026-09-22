import type { JSONSchema7TypeName } from 'json-schema';

import type { RJSFSchema } from '../src/index.ts';
import { getUnionTypes } from '../src/index.ts';

const cases: { schema: RJSFSchema; expected: JSONSchema7TypeName[] | undefined }[] = [
  {
    schema: { type: 'string' },
    expected: undefined,
  },
  {
    schema: {},
    expected: undefined,
  },
  {
    schema: { type: ['string'] },
    expected: undefined,
  },
  {
    schema: { type: ['string', 'null'] },
    expected: undefined,
  },
  {
    schema: { type: ['string', 'string'] },
    expected: undefined,
  },
  {
    schema: { type: ['string', 'number'] },
    expected: ['string', 'number'],
  },
  {
    schema: { type: ['string', 'number', 'null'] },
    expected: ['string', 'number', 'null'],
  },
  {
    schema: { type: ['string', 'string', 'boolean'] },
    expected: ['string', 'boolean'],
  },
  {
    schema: { type: ['string', 'bogus', 'boolean'] as JSONSchema7TypeName[] },
    expected: ['string', 'boolean'],
  },
  {
    schema: { type: ['string', 'bogus'] as JSONSchema7TypeName[] },
    expected: undefined,
  },
];

describe('getUnionTypes()', () => {
  test.each(cases.map((c) => [c.expected, c.schema]))(
    'should return the types "%s" allowed by the schema %j',
    (expected, schema) => {
      expect(getUnionTypes(schema)).toEqual(expected);
    },
  );
});
