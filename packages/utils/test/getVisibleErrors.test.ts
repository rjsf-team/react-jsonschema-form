import { getVisibleErrors } from '../src/index.ts';

describe('getVisibleErrors()', () => {
  it('returns the errors when they are not being hidden', () => {
    expect(getVisibleErrors({ rawErrors: ['oops'], hideError: false })).toEqual(['oops']);
  });

  it('returns the errors when hideError is not specified', () => {
    expect(getVisibleErrors({ rawErrors: ['oops'] })).toEqual(['oops']);
  });

  it('returns an empty array when the errors are being hidden', () => {
    expect(getVisibleErrors({ rawErrors: ['oops'], hideError: true })).toEqual([]);
  });

  it('returns an empty array when there are no errors', () => {
    expect(getVisibleErrors({})).toEqual([]);
  });
});
