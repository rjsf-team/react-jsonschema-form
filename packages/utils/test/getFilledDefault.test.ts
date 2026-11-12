import type { RJSFSchema, SchemaContext } from '../src/index.ts';
import { getFilledDefault } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const descendantWins: SchemaContext = { validator: getTestValidator({}) };
const ancestorWins: SchemaContext = {
  ...descendantWins,
  defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' },
};

describe('getFilledDefault()', () => {
  it('reads whichever of the two defaults is declared', () => {
    expect(getFilledDefault(descendantWins, { type: 'string', default: 'own' }, undefined)).toBe('own');
    expect(getFilledDefault(ancestorWins, { type: 'string' }, 'inherited')).toBe('inherited');
    expect(getFilledDefault(descendantWins, { type: 'string' }, undefined)).toBeUndefined();
  });

  it.each([
    { context: descendantWins, expected: null },
    { context: ancestorWins, expected: 'inherited' },
  ])('reads a null default of its own by nestedDefaultsPrecedence', ({ context, expected }) => {
    expect(getFilledDefault(context, { type: ['string', 'null'], default: null }, 'inherited')).toBe(expected);
  });

  it('reads its own default under ancestorWins where its type cannot hold the inherited one', () => {
    expect(getFilledDefault(ancestorWins, { type: 'string', default: 'own' }, null)).toBe('own');
  });

  it.each([
    { context: descendantWins, expected: { a: 'own', b: 'inherited', c: 'own' } },
    { context: ancestorWins, expected: { a: 'inherited', b: 'inherited', c: 'own' } },
  ])('merges two object defaults, the winner over the other', ({ context, expected }) => {
    const schema: RJSFSchema = { type: 'object', default: { a: 'own', c: 'own' } };

    expect(getFilledDefault(context, schema, { a: 'inherited', b: 'inherited' })).toEqual(expected);
  });

  it('takes one object default whole for a select over object constants', () => {
    const schema: RJSFSchema = { type: 'object', enum: [{ a: 1 }, { b: 2 }], default: { a: 1 } };

    expect(getFilledDefault(descendantWins, schema, { b: 2 })).toEqual({ a: 1 });
    expect(getFilledDefault(ancestorWins, schema, { b: 2 })).toEqual({ b: 2 });
  });

  it("reads no default for a property under emptyObjectFields: 'skipDefaults', and its own for the root or an item", () => {
    const skipDefaults: SchemaContext = {
      ...descendantWins,
      defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
    };
    const schema: RJSFSchema = { type: 'string', default: 'own' };

    expect(getFilledDefault(skipDefaults, schema, 'inherited', { isRequired: true })).toBeUndefined();
    expect(getFilledDefault(skipDefaults, schema, undefined)).toBe('own');
  });

  it.each([
    { placement: { isRequired: false }, expected: undefined },
    { placement: { isRequired: true }, expected: 'own' },
    { placement: { isRequired: true, isParentRequired: false }, expected: undefined },
    { placement: { isRequired: true, isParentRequired: true }, expected: 'own' },
  ])(
    "reads a property's default under emptyObjectFields: 'populateRequiredDefaults' only where it is written, at $placement",
    ({ placement, expected }) => {
      const populateRequired: SchemaContext = {
        ...descendantWins,
        defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
      };

      expect(getFilledDefault(populateRequired, { type: 'string', default: 'own' }, undefined, placement)).toBe(
        expected,
      );
    },
  );
});

describe('getFilledDefault() cuts an object default down key by key, as the fill builds it', () => {
  const populateRequired: SchemaContext = {
    ...descendantWins,
    defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
  };
  const optional = { isRequired: false, isParentRequired: true };
  const required = { isRequired: true, isParentRequired: true };

  it.each<{ name: string; context: SchemaContext; schema: RJSFSchema; placement: typeof optional; expected: unknown }>([
    {
      name: 'an optional key under populateRequiredDefaults leaves an optional object nothing to write',
      context: populateRequired,
      schema: { type: 'object', properties: { a: { type: 'number' } }, default: { a: 1 } },
      placement: optional,
      expected: undefined,
    },
    {
      name: 'an optional key under populateRequiredDefaults leaves a required object empty',
      context: populateRequired,
      schema: { type: 'object', properties: { a: { type: 'number' } }, default: { a: 1 } },
      placement: required,
      expected: {},
    },
    {
      name: 'a required key of a required object is written',
      context: populateRequired,
      schema: { type: 'object', properties: { a: { type: 'number' } }, required: ['a'], default: { a: 1 } },
      placement: required,
      expected: { a: 1 },
    },
    {
      name: 'a true property is a key like any other',
      context: populateRequired,
      schema: { type: 'object', properties: { a: true }, default: { a: 1 } },
      placement: required,
      expected: {},
    },
    {
      name: 'an empty optional object below leaves an optional object nothing to write',
      context: descendantWins,
      schema: { type: 'object', properties: { b: { type: 'object', properties: {} } }, default: { b: {} } },
      placement: optional,
      expected: undefined,
    },
    {
      name: 'a key no property declares is dropped',
      context: descendantWins,
      schema: { type: 'object', default: { a: 1 } },
      placement: required,
      expected: {},
    },
    {
      name: 'a key additionalProperties seeds is kept, whatever emptyObjectFields says',
      context: populateRequired,
      schema: {
        type: 'object',
        properties: { a: { type: 'number' } },
        additionalProperties: true,
        default: { a: 1, x: 2 },
      },
      placement: optional,
      expected: { x: 2 },
    },
    {
      name: 'an untyped field with no properties is written whole',
      context: populateRequired,
      schema: { default: { a: 1 } },
      placement: required,
      expected: { a: 1 },
    },
  ])('$name', ({ context, schema, placement, expected }) => {
    expect(getFilledDefault(context, schema, undefined, placement)).toEqual(expected);
  });

  it('leaves the object default whole without a placement', () => {
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'number' } }, default: { a: 1 } };

    expect(getFilledDefault(populateRequired, schema, undefined)).toEqual({ a: 1 });
  });
});
