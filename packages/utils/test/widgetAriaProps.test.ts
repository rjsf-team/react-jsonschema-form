import { ariaDescribedByIds, widgetAriaProps } from '../src/index.ts';

describe('widgetAriaProps()', () => {
  it('describes the widget by its own ids when its caller passes none', () => {
    expect(widgetAriaProps({ id: 'root_when' })).toEqual({
      'aria-label': undefined,
      'aria-describedby': ariaDescribedByIds('root_when'),
    });
  });
  it('names the widget as its caller asked', () => {
    expect(widgetAriaProps({ id: 'root_when_year', 'aria-label': 'When, year' })['aria-label']).toBe('When, year');
  });
  it("follows the caller's ids with the description the widget renders itself", () => {
    expect(
      widgetAriaProps({ id: 'root_when_year', 'aria-describedby': 'root_when__error root_when__help' })[
        'aria-describedby'
      ],
    ).toBe('root_when__error root_when__help root_when_year__description');
  });
});
