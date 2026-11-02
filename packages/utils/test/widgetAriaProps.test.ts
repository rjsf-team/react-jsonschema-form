import type { Registry, ResolvedPresentationDeclaration, WidgetAriaPropsInput } from '../src/index.ts';
import {
  ariaDescribedByIds,
  englishStringTranslator,
  resolveFieldPresentation,
  widgetAriaProps,
} from '../src/index.ts';

const describedOptions = {
  enumOptions: [
    { label: 'Red', value: 'r', schema: { const: 'r', description: 'Warm' } },
    { label: 'Blue', value: 'b', schema: { const: 'b' } },
  ],
};

const TEMPLATE: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

const colorProps: WidgetAriaPropsInput = {
  id: 'root_color',
  label: 'Color',
  options: describedOptions,
  registry: { translateString: englishStringTranslator } as Registry,
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
  const hiddenLabelPlan = resolveFieldPresentation({
    id: 'root_color',
    declaration: TEMPLATE,
    label: 'Color',
    showLabel: false,
  });
  it('names the widget by the label text its plan hides, unless its caller names it', () => {
    const props = { ...colorProps, 'aria-describedby': undefined, presentation: hiddenLabelPlan };
    expect(widgetAriaProps(props)['aria-label']).toBe('Color');
    expect(widgetAriaProps({ ...props, 'aria-label': 'Paint' })['aria-label']).toBe('Paint');
    expect(widgetAriaProps({ ...props, 'aria-label': '' })['aria-label']).toBe('Color');
  });
  describe('names a select no label names, as getControlAriaLabel() does', () => {
    const untitled = { ...colorProps, label: '' };
    it.each([
      ["its caller's ids", untitled],
      ['no ids of its caller', { ...untitled, 'aria-describedby': undefined }],
    ])('by its placeholder, else the translated prompt, rendered without a plan and with %s', (_, props) => {
      expect(widgetAriaProps(props)['aria-label']).toBe('Select ...');
      expect(widgetAriaProps({ ...props, placeholder: 'Pick one' })['aria-label']).toBe('Pick one');
    });
    it('by the label text of a plan whose template draws no label', () => {
      const presentation = resolveFieldPresentation({
        id: 'root_color',
        declaration: { ...TEMPLATE, label: 'self' },
        label: 'Color',
      });
      expect(widgetAriaProps({ ...colorProps, presentation })['aria-label']).toBe('Color');
    });
    it('by nothing where the widget names it itself, unless its caller names it', () => {
      expect(widgetAriaProps(untitled, true)['aria-label']).toBeUndefined();
      expect(widgetAriaProps({ ...untitled, 'aria-label': 'Paint' }, true)['aria-label']).toBe('Paint');
    });
  });
  it("leaves out the selected option's description when its plan hides the label, though hideLabel is false", () => {
    expect(
      widgetAriaProps({ ...colorProps, hideLabel: false, presentation: hiddenLabelPlan })['aria-describedby'],
    ).toBe('ext');
  });
  it("follows the caller's ids with the description of the selected option", () => {
    expect(widgetAriaProps(colorProps)['aria-describedby']).toBe('ext root_color__description');
  });
  it('describes the widget without a plan by nothing when its caller passes no ids, rather than by ids no element has', () => {
    expect(widgetAriaProps({ ...colorProps, 'aria-describedby': '', value: 'b' })).toEqual({
      'aria-label': undefined,
      'aria-describedby': undefined,
    });
  });
  it('describes the widget without a plan by the selected option alone when its caller passes no ids', () => {
    expect(widgetAriaProps({ ...colorProps, 'aria-describedby': '' })['aria-describedby']).toBe(
      'root_color__description',
    );
  });
  it('lists the description of the selected option once when its caller already passed it', () => {
    expect(
      widgetAriaProps({ ...colorProps, 'aria-describedby': 'ext root_color__description' })['aria-describedby'],
    ).toBe('ext root_color__description');
  });
  describe('with the plan of its field', () => {
    const presentation = resolveFieldPresentation({
      id: 'root_color',
      declaration: TEMPLATE,
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
    // `hideLabel` is true wherever the template draws the label, which the plan, not `hideLabel`, decides
    it('describes the widget by the selected option description its plan shows, whatever hideLabel says', () => {
      expect(widgetAriaProps({ ...colorProps, hideLabel: true, presentation })['aria-describedby']).toBe(
        'root_color__error root_color__help ext root_color__selectedOptionDescription',
      );
    });
    it("adds the caller's ids to the plan's, keeping the rest of the plan's attributes", () => {
      expect(widgetAriaProps({ ...colorProps, presentation, value: 'b' })).toEqual({
        'aria-label': undefined,
        'aria-describedby': 'root_color__error root_color__help ext',
        'aria-invalid': true,
      });
      expect(widgetAriaProps({ ...colorProps, presentation })['aria-describedby']).toBe(
        'root_color__error root_color__help ext root_color__selectedOptionDescription',
      );
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
