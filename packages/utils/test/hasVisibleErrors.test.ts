import { hasVisibleErrors } from '../src/index.ts';

describe('hasVisibleErrors()', () => {
  it('returns true when there are errors that are not being hidden', () => {
    expect(hasVisibleErrors({ rawErrors: ['oops'], hideError: false })).toBe(true);
  });

  it('returns true when hideError is not specified', () => {
    expect(hasVisibleErrors({ rawErrors: ['oops'] })).toBe(true);
  });

  it('returns false when the errors are being hidden', () => {
    expect(hasVisibleErrors({ rawErrors: ['oops'], hideError: true })).toBe(false);
  });

  it('returns false when there are no errors', () => {
    expect(hasVisibleErrors({})).toBe(false);
  });
});
