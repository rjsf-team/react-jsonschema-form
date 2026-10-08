import type { JSONSchema7TypeName } from 'json-schema';

import type { RJSFSchema } from '../src/index.ts';
import { getKnownTypes, getUnionTypes } from '../src/index.ts';

const knownCases: { schema: RJSFSchema; expected: JSONSchema7TypeName[] }[] = [
  {
    schema: { type: 'string' },
    expected: [],
  },
  {
    schema: {},
    expected: [],
  },
  {
    schema: { type: ['string'] },
    expected: ['string'],
  },
  {
    schema: { type: ['string', 'string', 'null'] },
    expected: ['string', 'null'],
  },
  {
    schema: { type: ['string', 'bogus'] as JSONSchema7TypeName[] },
    expected: ['string'],
  },
  {
    schema: { type: ['bogus'] as unknown as JSONSchema7TypeName[] },
    expected: [],
  },
];

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

describe('getKnownTypes()', () => {
  test.each(knownCases.map((c) => [c.expected, c.schema]))(
    'should return the types "%s" listed by the schema %j',
    (expected, schema) => {
      expect(getKnownTypes(schema)).toEqual(expected);
    },
  );
});
