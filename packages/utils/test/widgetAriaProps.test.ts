import { ariaDescribedByIds, widgetAriaProps } from '../src/index.ts';

describe('widgetAriaProps()', () => {
  it('describes the widget by its own ids when its caller passes none', () => {
    expect(widgetAriaProps({ id: 'root_when' })).toEqual({
      'aria-label': undefined,
      'aria-describedby': ariaDescribedByIds('root_when'),
    });
  });
  it('prefers what its caller passed', () => {
    expect(
      widgetAriaProps({ id: 'root_when_year', 'aria-label': 'When, year', 'aria-describedby': 'root_when__error' }),
    ).toEqual({
      'aria-label': 'When, year',
      'aria-describedby': 'root_when__error',
    });
  });
  it('falls back to the description the widget builds itself', () => {
    expect(widgetAriaProps({ id: 'root' }, 'root__value root__error')).toEqual({
      'aria-label': undefined,
      'aria-describedby': 'root__value root__error',
    });
    expect(widgetAriaProps({ id: 'root', 'aria-describedby': 'other' }, 'root__value')['aria-describedby']).toBe(
      'other',
    );
  });
});
