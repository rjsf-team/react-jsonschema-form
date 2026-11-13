import type { RJSFMarkedSchema, RJSFSchema } from '../src/index.ts';
import { constrainsAlike, GUESSED_TYPE_FLAG } from '../src/index.ts';

describe('constrainsAlike()', () => {
  it('reads a type guessed from the data as no type', () => {
    const guessed: RJSFMarkedSchema = { type: 'string', [GUESSED_TYPE_FLAG]: true };

    expect(constrainsAlike(guessed, {}, undefined, undefined)).toBe(true);
  });

  it.each([undefined, false])('reads the type of a schema whose guessed-type flag is %s', (flag) => {
    const declared: RJSFMarkedSchema = { type: 'string', [GUESSED_TYPE_FLAG]: flag };

    expect(constrainsAlike(declared, {}, undefined, undefined)).toBe(false);
  });

  it('reads the default the schema holding a field declares for it in place of its own', () => {
    const field: RJSFSchema = { type: 'string' };

    expect(constrainsAlike(field, field, 'a', 'a')).toBe(true);
    expect(constrainsAlike(field, field, 'a', 'b')).toBe(false);
    expect(constrainsAlike({ ...field, default: 'b' }, field, 'a', 'b')).toBe(true);
  });

  it('reads a null default of its own over the one the schema holding the field declares (#5815)', () => {
    const field: RJSFSchema = { type: ['string', 'null'] };

    expect(constrainsAlike({ ...field, default: null }, field, 'a', 'a')).toBe(false);
    expect(constrainsAlike({ ...field, default: null }, { ...field, default: null }, 'a', 'b')).toBe(true);
  });
});
