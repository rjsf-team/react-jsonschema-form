import type { JSONSchema7TypeName } from 'json-schema';

import type { RJSFSchema } from '../src/index.ts';
import { getSchemaOwnTypes, GUESSED_TYPE_FLAG } from '../src/index.ts';

const cases: { schema: RJSFSchema; expected: JSONSchema7TypeName[] | undefined }[] = [
  // A listed type wins, and only the recognized names in the list are offered
  { schema: { type: ['string', 'number'] }, expected: ['string', 'number'] },
  { schema: { type: ['string', 'null'] }, expected: ['string', 'null'] },
  { schema: { type: ['foo', 'null'] as JSONSchema7TypeName[] }, expected: ['null'] },
  { schema: { type: ['foo', 'bar'] as unknown as JSONSchema7TypeName[] }, expected: undefined },
  // A type named on its own is the one type the schema allows
  { schema: { type: 'string' }, expected: ['string'] },
  { schema: { type: 'object', properties: { a: { type: 'string' } } }, expected: ['object'] },
  { schema: { type: 'foo' as JSONSchema7TypeName }, expected: undefined },
  // The values of a typeless `enum`/`const` say what types they have, which `getSchemaType()` alone would not
  { schema: { enum: ['a', 'b'] }, expected: ['string'] },
  { schema: { enum: [1, 2] }, expected: ['number'] },
  { schema: { enum: [1, 'a', null] }, expected: ['number', 'string', 'null'] },
  // An empty `enum` offers no value to read a type from, so `getSchemaType()` answers, as it does for every other
  // reader of such a schema: `StringField` is the field it renders through
  { schema: { enum: [] }, expected: ['string'] },
  { schema: { const: 3 }, expected: ['number'] },
  { schema: { const: null }, expected: ['null'] },
  { schema: { const: undefined }, expected: ['null'] },
  // An `enum`/`const` under an unrecognized type narrows to the types the values have
  { schema: { type: 'foo' as JSONSchema7TypeName, enum: [1] }, expected: ['number'] },
  // A type the schema does name wins over its `enum`/`const` values, which answer for themselves rather than for it:
  // `guessType()` knows no `integer`, and a value of another type than the schema names is one the schema rejects
  { schema: { type: 'integer', enum: [1, 2] }, expected: ['integer'] },
  { schema: { type: 'string', enum: ['a', 1] }, expected: ['string'] },
  { schema: { type: 'number', const: 'a' }, expected: ['number'] },
  // Otherwise the type `getSchemaType()` infers, so this agrees with every other reader of the schema
  { schema: { properties: { a: { type: 'string' } } }, expected: ['object'] },
  { schema: { patternProperties: { '^a': { type: 'string' } } }, expected: ['object'] },
  { schema: { additionalProperties: { type: 'string' } }, expected: ['object'] },
  // A schema saying nothing about its value's type
  { schema: {}, expected: undefined },
  { schema: { items: { type: 'string' } }, expected: undefined },
  { schema: { title: 'no type here' }, expected: undefined },
];

describe('getSchemaOwnTypes()', () => {
  test.each(cases.map((c) => [c.expected, c.schema]))(
    'should return the types "%s" the schema %j says its value has',
    (expected, schema) => {
      expect(getSchemaOwnTypes(schema)).toEqual(expected);
    },
  );
  it('should say nothing for a schema whose type was guessed from the form data', () => {
    // An `additionalProperties` entry the schema puts no constraint on: the data named the type, so the value is free
    // to become anything, which is why the fallback UI offers every type for it
    const schema = { type: 'string', [GUESSED_TYPE_FLAG]: true } as unknown as RJSFSchema;
    expect(getSchemaOwnTypes(schema)).toBeUndefined();
  });
});
