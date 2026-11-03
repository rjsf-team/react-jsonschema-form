import type {
  FieldPresentation,
  MergedThemePresentation,
  Registry,
  ResolvedPresentationDeclaration,
  SelectedOptionDescriptionPlacement,
  WidgetAriaPropsInput,
} from '../src/index.ts';
import {
  ariaDescribedByIds,
  englishStringTranslator,
  getSelectorPresentation,
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
    it('by nothing where its plan has the widget draw its label, unless its caller names it', () => {
      const presentation = resolveFieldPresentation({
        id: 'root_color',
        declaration: { ...TEMPLATE, label: 'self' },
        label: 'Color',
      });
      expect(widgetAriaProps({ ...colorProps, presentation })['aria-label']).toBeUndefined();
      expect(widgetAriaProps({ ...colorProps, presentation, 'aria-label': 'Paint' })['aria-label']).toBe('Paint');
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
    it('gives the control the attributes of its plan, with the description of the selected option before the help', () => {
      expect(widgetAriaProps({ ...colorProps, 'aria-describedby': undefined, presentation })).toEqual({
        'aria-label': undefined,
        'aria-describedby': 'root_color__error root_color__selectedOptionDescription root_color__help',
        'aria-invalid': true,
      });
    });
    // `hideLabel` is true wherever the template draws the label, which the plan, not `hideLabel`, decides
    it('describes the widget by the selected option description its plan shows, whatever hideLabel says', () => {
      expect(widgetAriaProps({ ...colorProps, hideLabel: true, presentation })['aria-describedby']).toBe(
        'root_color__error root_color__selectedOptionDescription root_color__help ext',
      );
    });
    it("adds the caller's ids to the plan's, keeping the rest of the plan's attributes", () => {
      expect(widgetAriaProps({ ...colorProps, presentation, value: 'b' })).toEqual({
        'aria-label': undefined,
        'aria-describedby': 'root_color__error root_color__help ext',
        'aria-invalid': true,
      });
    });
    describe('places the selected option description where the widget draws it', () => {
      const describedPlan = resolveFieldPresentation({
        id: 'root_color',
        declaration: TEMPLATE,
        label: 'Color',
        description: 'Pick a color',
        help: 'Pick one',
      });
      const describedProps = { ...colorProps, presentation: describedPlan };
      const declaring = (selectedOptionDescription: SelectedOptionDescriptionPlacement) =>
        ({
          ...colorProps.registry,
          presentation: { selectedOptionDescription } as MergedThemePresentation,
        }) as Registry;
      const plan = (description?: string, help?: string) =>
        resolveFieldPresentation({ id: 'root_color', declaration: TEMPLATE, label: 'Color', description, help });
      it.each([
        [
          'afterDescription',
          'description and help',
          plan('Pick a color', 'Pick one'),
          'description selectedOptionDescription help',
        ],
        [
          'beforeDescription',
          'description and help',
          plan('Pick a color', 'Pick one'),
          'selectedOptionDescription description help',
        ],
        [
          'afterHelp',
          'description and help',
          plan('Pick a color', 'Pick one'),
          'description help selectedOptionDescription',
        ],
        ['afterDescription', 'help alone', plan(undefined, 'Pick one'), 'selectedOptionDescription help'],
        ['beforeDescription', 'help alone', plan(undefined, 'Pick one'), 'selectedOptionDescription help'],
        ['afterHelp', 'help alone', plan(undefined, 'Pick one'), 'help selectedOptionDescription'],
        ['afterHelp', 'description alone', plan('Pick a color'), 'description selectedOptionDescription'],
        ['afterDescription', 'neither', plan(), 'selectedOptionDescription'],
        ['afterHelp', 'neither', plan(), 'selectedOptionDescription'],
      ] as const)('under %s, with %s, lists it as %s', (placement, _, presentation, expected) => {
        const registry = declaring(placement);
        expect(
          widgetAriaProps({ ...colorProps, 'aria-describedby': undefined, presentation, registry })['aria-describedby'],
        ).toBe(
          expected
            .split(' ')
            .map((part) => `root_color__${part}`)
            .join(' '),
        );
      });
      it('lists it once, though the caller passed it elsewhere', () => {
        const props = {
          ...describedProps,
          'aria-describedby': 'root_color__selectedOptionDescription',
          registry: declaring('beforeDescription'),
        };
        expect(widgetAriaProps(props)['aria-describedby']).toBe(
          'root_color__selectedOptionDescription root_color__description root_color__help',
        );
      });
      it('leaves the ids alone when no option description is shown, or there is no plan', () => {
        const registry = declaring('beforeDescription');
        expect(widgetAriaProps({ ...describedProps, value: 'b', registry })['aria-describedby']).toBe(
          'root_color__description root_color__help ext',
        );
        expect(widgetAriaProps({ ...colorProps, registry })['aria-describedby']).toBe('ext root_color__description');
      });
      it("lists it after a description the field above draws itself, as an anyOf field's selector does", () => {
        const above = resolveFieldPresentation({
          id: 'root_color',
          declaration: { ...TEMPLATE, description: 'self' },
          label: 'Color',
          description: 'Pick a color',
        });
        const presentation = resolveFieldPresentation({
          id: 'root_color',
          declaration: TEMPLATE,
          label: 'Color',
          inherited: above,
        });
        const props = { ...colorProps, 'aria-describedby': undefined, presentation };
        expect(widgetAriaProps({ ...props, registry: declaring('beforeDescription') })['aria-describedby']).toBe(
          `${presentation.description.id} root_color__selectedOptionDescription`,
        );
        // A nested anyOf field passes the description down through a level that is `above` itself
        const nested = resolveFieldPresentation({
          id: 'root_color',
          declaration: TEMPLATE,
          label: 'Color',
          inherited: presentation,
        });
        expect(
          widgetAriaProps({ ...props, presentation: nested, registry: declaring('beforeDescription') })[
            'aria-describedby'
          ],
        ).toBe(`${presentation.description.id} root_color__selectedOptionDescription`);
      });
      describe('with a description and help of its own under a field above with its own', () => {
        const fieldPlan = (declaration = TEMPLATE) =>
          resolveFieldPresentation({
            id: 'root_color',
            declaration,
            label: 'Color',
            description: 'Field',
            help: 'Field help',
          });
        const optionPlan = (inherited: FieldPresentation) =>
          resolveFieldPresentation({
            id: 'root_color',
            declaration: TEMPLATE,
            label: 'Color',
            description: 'Own',
            help: 'Own help',
            inherited,
          });
        const selected = 'root_color__selectedOptionDescription';
        it.each([
          ['afterDescription', ['fieldDescription', 'ownDescription', selected, 'fieldHelp', 'ownHelp']],
          ['beforeDescription', [selected, 'fieldDescription', 'fieldHelp', 'ownDescription', 'ownHelp']],
          ['afterHelp', ['fieldDescription', 'fieldHelp', 'ownDescription', 'ownHelp', selected]],
        ] as const)('lists it under %s around every level', (placement, expected) => {
          const field = fieldPlan();
          const presentation = optionPlan(field);
          const ids: Record<string, string> = {
            fieldDescription: field.description.id,
            fieldHelp: field.help.id,
            ownDescription: presentation.description.id,
            ownHelp: presentation.help.id,
          };
          expect(
            widgetAriaProps({ ...colorProps, presentation, registry: declaring(placement) })['aria-describedby'],
          ).toBe([...expected.map((part) => ids[part] ?? part), 'ext'].join(' '));
        });
        it('lists it after the parts a field above draws itself, and before those the option draws', () => {
          const field = fieldPlan({ ...TEMPLATE, description: 'self', help: 'self' });
          const presentation = optionPlan(field);
          expect(
            widgetAriaProps({
              ...colorProps,
              'aria-describedby': undefined,
              presentation,
              registry: declaring('beforeDescription'),
            })['aria-describedby'],
          ).toBe(
            [field.description.id, field.help.id, selected, presentation.description.id, presentation.help.id].join(
              ' ',
            ),
          );
        });
        // The selector's plan repeats the parts its field draws itself as its own, and it is the select that draws them
        it.each([
          ['afterDescription', ['description', 'option', 'help']],
          ['beforeDescription', ['option', 'description', 'help']],
          ['afterHelp', ['description', 'help', 'option']],
        ] as const)('lists it once among the parts a selector draws itself under %s', (placement, expected) => {
          const field = fieldPlan({ ...TEMPLATE, description: 'self', help: 'self' });
          const presentation = getSelectorPresentation(field, 'root_color');
          const ids = { description: field.description.id, option: selected, help: field.help.id };
          expect(
            widgetAriaProps({
              ...colorProps,
              'aria-describedby': undefined,
              presentation,
              registry: declaring(placement),
            })['aria-describedby'],
          ).toBe(expected.map((part) => ids[part]).join(' '));
        });
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
