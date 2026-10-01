import { getDeprecatedHandling } from '../src/index.ts';

describe('getDeprecatedHandling()', () => {
  it('returns undefined for a schema that is not deprecated', () => {
    expect(getDeprecatedHandling({ type: 'string' }, {})).toBeUndefined();
  });

  // The option only ever applies to a deprecated schema, so it cannot hide or disable a field on its own
  it('ignores a deprecatedHandling option on a schema that is not deprecated', () => {
    expect(getDeprecatedHandling({ type: 'string' }, { deprecatedHandling: 'hide' })).toBeUndefined();
  });

  it('defaults a deprecated schema to label', () => {
    expect(getDeprecatedHandling({ type: 'string', deprecated: true }, {})).toBe('label');
  });

  it.each(['hide', 'disable', 'label'] as const)('honors a deprecatedHandling of %s', (handling) => {
    expect(getDeprecatedHandling({ type: 'string', deprecated: true }, { deprecatedHandling: handling })).toBe(
      handling,
    );
  });

  it('treats a falsy deprecated keyword as not deprecated', () => {
    expect(
      getDeprecatedHandling({ type: 'string', deprecated: false }, { deprecatedHandling: 'hide' }),
    ).toBeUndefined();
  });
});
