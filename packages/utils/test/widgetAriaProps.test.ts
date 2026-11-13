import { ariaDescribedByIds } from '../src/idGenerators.ts';
import type {
  FieldPresentation,
  FieldTemplateOrder,
  MergedThemePresentation,
  Registry,
  ResolvedPresentationDeclaration,
  WidgetAriaPropsInput,
} from '../src/index.ts';
import {
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
      const declaring = (
        presentation: Pick<MergedThemePresentation, 'selectedOptionDescription' | 'fieldTemplateOrder'>,
      ) => ({ ...colorProps.registry, presentation: presentation as MergedThemePresentation }) as Registry;
      const beforeOwnDescription = declaring({ selectedOptionDescription: 'beforeDescription' });
      const childrenFirst: FieldTemplateOrder = ['children', 'description', 'help'];
      const helpAbove: FieldTemplateOrder = ['description', 'help', 'children'];
      const plan = (description?: string, help?: string) =>
        resolveFieldPresentation({ id: 'root_color', declaration: TEMPLATE, label: 'Color', description, help });
      // The select sits in the template's children, so the template's order places it among the parts the template draws
      it.each([
        [
          'the default order',
          undefined,
          'description and help',
          plan('Pick a color', 'Pick one'),
          'description selectedOptionDescription help',
        ],
        [
          'a children-first order',
          childrenFirst,
          'description and help',
          plan('Pick a color', 'Pick one'),
          'selectedOptionDescription description help',
        ],
        [
          'a children-last order',
          helpAbove,
          'description and help',
          plan('Pick a color', 'Pick one'),
          'description help selectedOptionDescription',
        ],
        ['the default order', undefined, 'help alone', plan(undefined, 'Pick one'), 'selectedOptionDescription help'],
        [
          'a children-last order',
          helpAbove,
          'help alone',
          plan(undefined, 'Pick one'),
          'help selectedOptionDescription',
        ],
        [
          'a children-last order',
          helpAbove,
          'description alone',
          plan('Pick a color'),
          'description selectedOptionDescription',
        ],
        ['the default order', undefined, 'neither', plan(), 'selectedOptionDescription'],
        ['a children-last order', helpAbove, 'neither', plan(), 'selectedOptionDescription'],
      ] as const)('under %s, with %s, lists it as %s', (_, fieldTemplateOrder, __, presentation, expected) => {
        const registry = declaring({ fieldTemplateOrder });
        expect(
          widgetAriaProps({ ...colorProps, 'aria-describedby': undefined, presentation, registry })['aria-describedby'],
        ).toBe(
          expected
            .split(' ')
            .map((part) => `root_color__${part}`)
            .join(' '),
        );
      });
      it("leaves the parts the template draws to its order under 'beforeDescription'", () => {
        expect(
          widgetAriaProps({ ...describedProps, 'aria-describedby': undefined, registry: beforeOwnDescription })[
            'aria-describedby'
          ],
        ).toBe('root_color__description root_color__selectedOptionDescription root_color__help');
      });
      it('lists it once, though the caller passed it elsewhere', () => {
        const props = {
          ...describedProps,
          'aria-describedby': 'root_color__selectedOptionDescription',
          registry: declaring({ fieldTemplateOrder: childrenFirst }),
        };
        expect(widgetAriaProps(props)['aria-describedby']).toBe(
          'root_color__selectedOptionDescription root_color__description root_color__help',
        );
      });
      it('leaves the ids alone when no option description is shown, or there is no plan', () => {
        const registry = declaring({ fieldTemplateOrder: childrenFirst });
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
        expect(widgetAriaProps({ ...props, registry: beforeOwnDescription })['aria-describedby']).toBe(
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
          widgetAriaProps({ ...props, presentation: nested, registry: beforeOwnDescription })['aria-describedby'],
        ).toBe(`${presentation.description.id} root_color__selectedOptionDescription`);
      });
      describe('with a description and help of its own under a field above with its own', () => {
        const fieldPlan = (declaration = TEMPLATE, templateOrder?: FieldTemplateOrder) =>
          resolveFieldPresentation({
            id: 'root_color',
            declaration,
            label: 'Color',
            description: 'Field',
            help: 'Field help',
            templateOrder,
          });
        const optionPlan = (inherited: FieldPresentation, templateOrder?: FieldTemplateOrder) =>
          resolveFieldPresentation({
            id: 'root_color',
            declaration: TEMPLATE,
            label: 'Color',
            description: 'Own',
            help: 'Own help',
            inherited,
            templateOrder,
          });
        const selected = 'root_color__selectedOptionDescription';
        it.each([
          [
            ['description', 'children', 'help'],
            ['fieldDescription', 'ownDescription', selected, 'ownHelp', 'fieldHelp'],
          ],
          [
            ['children', 'description', 'help'],
            [selected, 'ownDescription', 'ownHelp', 'fieldDescription', 'fieldHelp'],
          ],
          [
            ['children', 'help', 'description'],
            [selected, 'ownHelp', 'ownDescription', 'fieldHelp', 'fieldDescription'],
          ],
          [
            ['description', 'help', 'children'],
            ['fieldDescription', 'fieldHelp', 'ownDescription', 'ownHelp', selected],
          ],
        ] as const)('lists it under the template order %j around every level', (fieldTemplateOrder, expected) => {
          const templateOrder: FieldTemplateOrder = fieldTemplateOrder;
          const field = fieldPlan(TEMPLATE, templateOrder);
          const presentation = optionPlan(field, templateOrder);
          const ids: Record<string, string> = {
            fieldDescription: field.description.id,
            fieldHelp: field.help.id,
            ownDescription: presentation.description.id,
            ownHelp: presentation.help.id,
          };
          expect(
            widgetAriaProps({ ...colorProps, presentation, registry: declaring({ fieldTemplateOrder }) })[
              'aria-describedby'
            ],
          ).toBe([...expected.map((part) => ids[part] ?? part), 'ext'].join(' '));
        });
        it('lists it after the parts a field above draws itself, and before those the option draws', () => {
          const field = fieldPlan({ ...TEMPLATE, description: 'self', help: 'self' });
          const presentation = optionPlan(field, childrenFirst);
          expect(
            widgetAriaProps({
              ...colorProps,
              'aria-describedby': undefined,
              presentation,
              registry: declaring({ fieldTemplateOrder: childrenFirst }),
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
        ] as const)('lists it once among the parts a selector draws itself under %s', (placement, expected) => {
          const field = fieldPlan({ ...TEMPLATE, description: 'self', help: 'self' });
          const presentation = getSelectorPresentation(field, 'root_color');
          const ids = { description: field.description.id, option: selected, help: field.help.id };
          expect(
            widgetAriaProps({
              ...colorProps,
              'aria-describedby': undefined,
              presentation,
              registry: declaring({ selectedOptionDescription: placement }),
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
