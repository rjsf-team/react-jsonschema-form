import type { Registry, WidgetAriaPropsInput } from '../src/index.ts';
import { ariaDescribedByIds, resolveFieldPresentation, widgetAriaProps } from '../src/index.ts';

const describedOptions = {
  enumOptions: [
    { label: 'Red', value: 'r', schema: { const: 'r', description: 'Warm' } },
    { label: 'Blue', value: 'b', schema: { const: 'b' } },
  ],
};

const colorProps: WidgetAriaPropsInput = {
  id: 'root_color',
  options: describedOptions,
  registry: {} as Registry,
  value: 'r',
  'aria-describedby': 'ext',
};

describe('widgetAriaProps()', () => {
  it('describes the widget by its own ids when its caller passes none', () => {
    expect(widgetAriaProps({ ...colorProps, 'aria-describedby': undefined })).toEqual({
      'aria-label': undefined,
      'aria-describedby': ariaDescribedByIds('root_color'),
    });
  });
  it('names the widget as its caller asked', () => {
    expect(widgetAriaProps({ ...colorProps, 'aria-label': 'When, year' })['aria-label']).toBe('When, year');
  });
  it("follows the caller's ids with the description of the selected option", () => {
    expect(widgetAriaProps(colorProps)['aria-describedby']).toBe('ext root_color__description');
  });
  describe('with the plan of its field', () => {
    const presentation = resolveFieldPresentation({
      id: 'root_color',
      declaration: {
        label: 'template',
        description: 'template',
        errors: 'template',
        help: 'template',
        labelledBy: 'for',
      },
      label: 'Color',
      help: 'Pick one',
      errors: ['is required'],
    });
    it('gives the control the attributes of its plan, followed by the description of the selected option', () => {
      expect(widgetAriaProps({ ...colorProps, 'aria-describedby': undefined, presentation })).toEqual({
        'aria-label': undefined,
        'aria-describedby': 'root_color__error root_color__help root_color__selectedOptionDescription',
        'aria-invalid': true,
      });
    });
    it("leaves the control to the caller's ids when it passes some", () => {
      expect(widgetAriaProps({ ...colorProps, presentation, value: 'b' })).toEqual({
        'aria-label': undefined,
        'aria-describedby': 'ext',
      });
    });
  });
  it.each([
    ['is multiple', { multiple: true, value: ['r'] }],
    ['hides its label', { hideLabel: true }],
    ['has its label turned off in the uiSchema', { uiSchema: { 'ui:label': false } }],
    ['has selected an option with no description', { value: 'b' }],
    ['has nothing selected', { value: undefined }],
    ['has no options', { options: {} }],
  ])("describes a select that %s by the caller's ids alone", (_, overrides) => {
    expect(widgetAriaProps({ ...colorProps, ...overrides })['aria-describedby']).toBe('ext');
  });
});
