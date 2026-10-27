import { joinClassNames } from '../src/index.ts';

describe('joinClassNames()', () => {
  it('joins the class names present with a space', () => {
    expect(joinClassNames('rjsf-field-label', 'control-label', 'text-danger')).toBe(
      'rjsf-field-label control-label text-danger',
    );
  });
  it('leaves out a falsy conditional or an empty class', () => {
    const hasErrors = false;
    expect(joinClassNames('rjsf-field-label', undefined, null, '', hasErrors && 'text-danger')).toBe(
      'rjsf-field-label',
    );
  });
  it('returns an empty string where no class is present', () => {
    expect(joinClassNames(undefined, false)).toBe('');
  });
});
