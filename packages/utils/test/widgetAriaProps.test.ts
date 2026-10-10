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
  it("follows the caller's ids with the description a select with a described option renders itself", () => {
    const options = { enumOptions: [{ label: 'Red', value: 'r', schema: { const: 'r', description: 'Warm' } }] };
    expect(widgetAriaProps({ id: 'root_color', 'aria-describedby': 'ext', options })['aria-describedby']).toBe(
      'ext root_color__description',
    );
  });
  it("describes a select with no described option by the caller's ids alone", () => {
    const options = { enumOptions: [{ label: '2020', value: 2020 }] };
    expect(
      widgetAriaProps({ id: 'root_when_year', 'aria-describedby': 'root_when__error root_when__help', options })[
        'aria-describedby'
      ],
    ).toBe('root_when__error root_when__help');
  });
  it("describes a widget with no options by the caller's ids alone", () => {
    expect(widgetAriaProps({ id: 'root_when_year', 'aria-describedby': 'root_when__help' })['aria-describedby']).toBe(
      'root_when__help',
    );
  });
});
