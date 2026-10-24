import { isFieldHidden } from '../src/index.ts';

describe('isFieldHidden()', () => {
  it('returns false for a field with neither a hidden widget nor a hidden deprecation', () => {
    expect(isFieldHidden({ type: 'string' }, {})).toBe(false);
  });

  it('returns true for a hidden widget', () => {
    expect(isFieldHidden({ type: 'string' }, { widget: 'hidden' })).toBe(true);
  });

  it('returns true for a deprecated schema under deprecatedHandling hide', () => {
    expect(isFieldHidden({ type: 'string', deprecated: true }, { deprecatedHandling: 'hide' })).toBe(true);
  });

  it.each(['label', 'disable'] as const)('returns false for a deprecated schema under %s', (handling) => {
    expect(isFieldHidden({ type: 'string', deprecated: true }, { deprecatedHandling: handling })).toBe(false);
  });

  it('returns false for deprecatedHandling hide on a schema that is not deprecated', () => {
    expect(isFieldHidden({ type: 'string' }, { deprecatedHandling: 'hide' })).toBe(false);
  });
});
