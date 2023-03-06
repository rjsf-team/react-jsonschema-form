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
    schema: { properties: {} },
    expected: 'object',
  },
  {
    schema: { additionalProperties: {} },
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
  it('should correctly guess the type of a schema', () => {
    for (const test of cases) {
      expect(
        getSchemaType(test.schema),
        `${JSON.stringify(test.schema)} should guess type of ${test.expected}`
      ).toEqual(test.expected);
    }
  });
});
