import { isFieldHidden } from '../src/index.ts';

describe('isFieldHidden()', () => {
  it('returns false for a field with neither a hidden widget nor a hidden deprecation', () => {
    expect(isFieldHidden({}, undefined)).toBe(false);
  });

  it('returns true for a hidden widget', () => {
    expect(isFieldHidden({ widget: 'hidden' }, undefined)).toBe(true);
  });

  it('returns true for a hide handling', () => {
    expect(isFieldHidden({}, 'hide')).toBe(true);
  });

  it.each(['label', 'disable'] as const)('returns false for a %s handling', (handling) => {
    expect(isFieldHidden({}, handling)).toBe(false);
  });
});
