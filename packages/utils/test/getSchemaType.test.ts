import { getSchemaType } from '../src';

const cases: { schema: object; expected: string | undefined }[] = [
  {
    schema: { type: 'string' },
    expected: 'string',
  },
  {
    schema: { type: 'number' },
    expected: 'number',
  },
  {
    schema: { type: 'integer' },
    expected: 'integer',
  },
  {
    schema: { type: 'object' },
    expected: 'object',
  },
  {
    schema: { type: 'array' },
    expected: 'array',
  },
  {
    schema: { type: 'boolean' },
    expected: 'boolean',
  },
  {
    schema: { type: 'null' },
    expected: 'null',
  },
  {
    schema: { const: 'foo' },
    expected: 'string',
  },
  {
    schema: { const: 1 },
    expected: 'number',
  },
  {
    schema: { type: ['string', 'null'] },
    expected: 'string',
  },
  {
    schema: { type: ['null', 'number'] },
    expected: 'number',
  },
  {
    schema: { type: ['integer', 'null'] },
    expected: 'integer',
  },
  {
    schema: { type: ['string', 'number'] },
    expected: 'string',
  },
  {
    schema: { type: ['number', 'string'] },
    expected: 'number',
  },
  {
    schema: { properties: {} },
    expected: 'object',
  },
  {
    schema: { additionalProperties: {} },
    expected: 'object',
  },
  {
    schema: { patternProperties: { '^foo': {} } },
    expected: 'object',
  },
  {
    schema: { enum: ['foo'] },
    expected: 'string',
  },
  {
    schema: {},
    expected: undefined,
  },
];

describe('getSchemaType()', () => {
  test.each(cases.map((c) => [c.expected, c.schema]))(
    `should correctly guess the type "%s" of a schema %j`,
    (expected, schema) => {
      expect(getSchemaType(schema)).toBe(expected);
    },
  );
});
