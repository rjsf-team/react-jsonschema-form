import type { FieldFill, RJSFMarkedSchema, RJSFSchema, SchemaContext } from '../src/index.ts';
import { constrainsAlike, constrainsAlikeAsideDefault, GUESSED_TYPE_FLAG } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const context: SchemaContext = { validator: getTestValidator({}) };

/** The fill of a field the schema holding it hands `inheritedDefault` */
const inheriting = (inheritedDefault: unknown): FieldFill => ({ inheritedDefault });

describe('constrainsAlike()', () => {
  it('reads a type guessed from the data as no type', () => {
    const guessed: RJSFMarkedSchema = { type: 'string', [GUESSED_TYPE_FLAG]: true };

    expect(constrainsAlike(context, guessed, {}, {})).toBe(true);
  });

  it.each([undefined, false])('reads the type of a schema whose guessed-type flag is %s', (flag) => {
    const declared: RJSFMarkedSchema = { type: 'string', [GUESSED_TYPE_FLAG]: flag };

    expect(constrainsAlike(context, declared, {}, {})).toBe(false);
  });

  it("leaves the defaults out with constrainsAlikeAsideDefault(), an anyOf/oneOf option's included", () => {
    const withOptionDefault = (a: number): RJSFSchema => ({
      type: 'object',
      properties: { a: { type: 'number' } },
      oneOf: [{ default: { a } }],
    });

    expect(constrainsAlike(context, withOptionDefault(1), withOptionDefault(2), {})).toBe(false);
    expect(constrainsAlikeAsideDefault(withOptionDefault(1), withOptionDefault(2))).toBe(true);
    expect(constrainsAlikeAsideDefault(withOptionDefault(1), { ...withOptionDefault(1), maxItems: 1 })).toBe(false);
  });

  it('reads the default the schema holding a field declares for it in place of its own', () => {
    const field: RJSFSchema = { type: 'string' };

    expect(constrainsAlike(context, field, field, {}, inheriting('a'), inheriting('a'))).toBe(true);
    expect(constrainsAlike(context, field, field, {}, inheriting('a'), inheriting('b'))).toBe(false);
    expect(constrainsAlike(context, { ...field, default: 'b' }, field, {}, inheriting('a'), inheriting('b'))).toBe(
      true,
    );
  });

  it('reads a null default of its own over the one the schema holding the field declares (#5815)', () => {
    const field: RJSFSchema = { type: ['string', 'null'] };

    expect(constrainsAlike(context, { ...field, default: null }, field, {}, inheriting('a'), inheriting('a'))).toBe(
      false,
    );
    expect(
      constrainsAlike(
        context,
        { ...field, default: null },
        { ...field, default: null },
        {},
        inheriting('a'),
        inheriting('b'),
      ),
    ).toBe(true);
  });

  it('reads the default the schema holding a field declares for it over its own under ancestorWins (#5817)', () => {
    const ancestorWins: SchemaContext = {
      ...context,
      defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' },
    };
    const field: RJSFSchema = { type: ['string', 'null'], default: null };

    expect(constrainsAlike(context, field, field, {}, inheriting('x'), inheriting('z'))).toBe(true);
    expect(constrainsAlike(ancestorWins, field, field, {}, inheriting('x'), inheriting('z'))).toBe(false);
  });
});
