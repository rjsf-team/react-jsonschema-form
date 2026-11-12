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
