import type { ReactNode } from 'react';
import { createTheme, MantineProvider, STYLE_PROPS_DATA, Tooltip } from '@mantine/core';
import type { GenericObjectType, RJSFSchema, UiSchema } from '@rjsf/utils';
import { titleId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

const orderWithoutLabel = ['description', 'input', 'error'];

const enumSchema: RJSFSchema = { type: 'string', enum: ['a', 'b'] };
const checkboxesSchema: RJSFSchema = { type: 'array', items: enumSchema, uniqueItems: true };

const widgets: [string, RJSFSchema, UiSchema?][] = [
  ['text', { type: 'string' }],
  ['number', { type: 'number' }],
  ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
  ['password', { type: 'string' }, { 'ui:widget': 'password' }],
  ['select', enumSchema],
  ['multi-select', checkboxesSchema],
  ['checkboxes', checkboxesSchema, { 'ui:widget': 'checkboxes' }],
  ['radio', enumSchema, { 'ui:widget': 'radio' }],
  ['checkbox', { type: 'boolean' }],
  ['range', { type: 'integer' }, { 'ui:widget': 'range' }],
  ['color', { type: 'string', format: 'color' }],
  ['file', { type: 'string', format: 'data-url' }],
  ['time', { type: 'string', format: 'time' }],
  ['date', { type: 'string', format: 'date' }],
  ['date-time', { type: 'string', format: 'date-time' }],
  ['alt-date', { type: 'string' }, { 'ui:widget': 'alt-date' }],
  ['alt-datetime', { type: 'string' }, { 'ui:widget': 'alt-datetime' }],
];

const labelCases: [string, RJSFSchema, UiSchema][] = [
  ['a shown label', { title: 'A title' }, {}],
  ['a hidden label', { title: 'A title' }, { 'ui:label': false }],
  [
    'a label left out of inputWrapperOrder',
    { title: 'A title' },
    { 'ui:options': { inputWrapperOrder: orderWithoutLabel } },
  ],
  ['no title', {}, {}],
];

function renderField(schema: RJSFSchema, uiSchema: UiSchema = {}) {
  return render(<WrappedForm schema={schema} uiSchema={uiSchema} validator={validator} />);
}

describe('aria-labelledby', () => {
  // Mantine's `Select` and `MultiSelect` point their listbox's `aria-labelledby` at their own label id whenever a label
  // is passed, rendered or not (https://github.com/mantinedev/mantine/issues/9219), so they are left out of the case
  // where `inputWrapperOrder` drops the label, and covered by the skipped case below instead. Once a Mantine release
  // fixes that, drop this filter and unskip that case.
  const labelCaseWidgets = (labelCase: string) =>
    labelCase.includes('inputWrapperOrder')
      ? widgets.filter(([name]) => name !== 'select' && name !== 'multi-select')
      : widgets;

  describe.each(labelCases)('with %s', (labelCase, labelSchema, labelUiSchema) => {
    test.each(labelCaseWidgets(labelCase))('%s widget only references elements that exist', (_, schema, uiSchema) => {
      const { container } = renderField({ ...schema, ...labelSchema }, { ...uiSchema, ...labelUiSchema });

      for (const el of container.querySelectorAll('[aria-labelledby]')) {
        for (const id of el.getAttribute('aria-labelledby')!.split(/\s+/)) {
          expect(container.querySelector(`[id="${id}"]`)).toBeInTheDocument();
        }
      }
    });
  });

  test.each([
    ['checkboxes', 'group', checkboxesSchema, { 'ui:widget': 'checkboxes' }],
    ['radio', 'radiogroup', enumSchema, { 'ui:widget': 'radio' }],
  ] as [string, string, RJSFSchema, UiSchema][])(
    '%s widget names its group by the field title, whether the label is shown or hidden',
    (_, role, schema, uiSchema) => {
      const { rerender } = renderField({ ...schema, title: 'A title' }, uiSchema);

      expect(screen.getByRole(role)).toHaveAttribute('aria-labelledby', titleId('root'));
      expect(screen.getByRole(role)).toHaveAccessibleName('A title');
      expect(screen.getByText('A title')).toBeVisible();

      rerender(
        <WrappedForm
          schema={{ ...schema, title: 'A title' }}
          uiSchema={{ ...uiSchema, 'ui:label': false }}
          validator={validator}
        />,
      );

      expect(screen.getByRole(role)).toHaveAttribute('aria-labelledby', titleId('root'));
      expect(screen.getByRole(role)).toHaveAccessibleName('A title');
      expect(screen.getByText('A title')).not.toBeVisible();
    },
  );

  test.each([
    ['checkboxes', 'group', checkboxesSchema, { 'ui:widget': 'checkboxes' }],
    ['radio', 'radiogroup', enumSchema, { 'ui:widget': 'radio' }],
  ] as [string, string, RJSFSchema, UiSchema][])(
    '%s widget leaves its group unlabelled when the field has no label',
    (_, role, schema, uiSchema) => {
      renderField(schema, uiSchema);

      expect(screen.getByRole(role)).not.toHaveAttribute('aria-labelledby');
    },
  );

  test.each([
    ['checkboxes', 'ui:options', 'group', checkboxesSchema, 'checkboxes'],
    ['checkboxes', 'theme', 'group', checkboxesSchema, 'checkboxes'],
    ['radio', 'ui:options', 'radiogroup', enumSchema, 'radio'],
    ['radio', 'theme', 'radiogroup', enumSchema, 'radio'],
  ] as [string, string, string, RJSFSchema, string][])(
    '%s widget names its group by the field title when an inputWrapperOrder from the %s leaves the label out',
    (_, source, role, schema, widget) => {
      const component = role === 'group' ? 'CheckboxGroup' : 'RadioGroup';
      const components =
        source === 'theme' ? { [component]: { defaultProps: { inputWrapperOrder: orderWithoutLabel } } } : {};
      render(
        <MantineProvider theme={createTheme({ components })}>
          <Form
            schema={{ ...schema, title: 'A title' }}
            uiSchema={{
              'ui:widget': widget,
              ...(source === 'ui:options' && { 'ui:options': { inputWrapperOrder: orderWithoutLabel } }),
            }}
            validator={validator}
          />
        </MantineProvider>,
      );

      expect(screen.getByRole(role)).toHaveAccessibleName('A title');
      expect(screen.getByText('A title')).not.toBeVisible();
    },
  );

  test('range widget names its slider thumb by the field title, whether the label is shown or hidden', () => {
    const { rerender } = renderField({ type: 'integer', title: 'A title' }, { 'ui:widget': 'range' });

    expect(screen.getByRole('slider')).toHaveAttribute('aria-labelledby', titleId('root'));
    expect(screen.getByRole('slider')).toHaveAccessibleName('A title');
    expect(screen.getByText('A title')).toBeVisible();

    rerender(
      <WrappedForm
        schema={{ type: 'integer', title: 'A title' }}
        uiSchema={{ 'ui:widget': 'range', 'ui:label': false }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-labelledby', titleId('root'));
    expect(screen.getByRole('slider')).toHaveAccessibleName('A title');
    expect(screen.getByText('A title')).not.toBeVisible();
  });

  test('range widget keeps an aria-labelledby from ui:options.thumbProps', () => {
    renderField(
      { type: 'integer', title: 'A title' },
      { 'ui:widget': 'range', 'ui:options': { thumbProps: { 'aria-labelledby': 'my-label' } } },
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-labelledby', 'my-label');
  });

  test('range widget keeps the slider thumb named by a thumbLabel from ui:options', () => {
    renderField(
      { type: 'integer', title: 'A title' },
      { 'ui:widget': 'range', 'ui:options': { thumbLabel: 'Volume' } },
    );

    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('slider')).toHaveAccessibleName('Volume');
  });

  test('range widget keeps the slider thumb named by a thumbLabel from the Mantine theme', () => {
    render(
      <MantineProvider theme={createTheme({ components: { Slider: { defaultProps: { thumbLabel: 'Volume' } } } })}>
        <Form
          schema={{ type: 'integer', title: 'A title' }}
          uiSchema={{ 'ui:widget': 'range' }}
          validator={validator}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole('slider')).toHaveAccessibleName('Volume');
  });

  test('alt-date widget names each part by the field title and the part, whether the label is shown or hidden', () => {
    const partNames = () => screen.getAllByRole('combobox').map((part) => part.getAttribute('aria-label'));
    const { rerender } = renderField({ type: 'string', title: 'Birthday' }, { 'ui:widget': 'alt-date' });

    expect(screen.getAllByRole('combobox').map((part) => part.id)).toEqual(['root_year', 'root_month', 'root_day']);
    for (const part of screen.getAllByRole('combobox')) {
      expect(part).toHaveAccessibleName(`Birthday, ${part.id.replace('root_', '')}`);
      expect(part).not.toHaveAttribute('aria-labelledby');
    }
    expect(screen.getByText('Birthday')).toBeVisible();
    const shownNames = partNames();

    rerender(
      <WrappedForm
        schema={{ type: 'string', title: 'Birthday' }}
        uiSchema={{ 'ui:widget': 'alt-date', 'ui:label': false }}
        validator={validator}
      />,
    );

    expect(partNames()).toEqual(shownNames);
    expect(screen.getByRole('combobox', { name: 'Birthday, year' })).toBeInTheDocument();
    expect(screen.getByText('Birthday')).not.toBeVisible();
  });

  test('alt-date widget names each part by the part alone when the field has no label', () => {
    renderField({ type: 'string' }, { 'ui:widget': 'alt-date' });

    expect(screen.getByRole('combobox', { name: 'year' })).not.toHaveAttribute('aria-labelledby');
  });

  test('alt-date widget names each part listbox the way it names the part', () => {
    renderField({ type: 'string', title: 'Birthday' }, { 'ui:widget': 'alt-date' });

    expect(
      screen.getAllByRole('listbox', { hidden: true }).map((listbox) => listbox.getAttribute('aria-label')),
    ).toEqual(['Birthday, year', 'Birthday, month', 'Birthday, day']);
  });

  test('alt-date widget keeps each part named, with unique ids, when the theme gives Select a label', () => {
    const { container } = render(
      <MantineProvider theme={createTheme({ components: { Select: { defaultProps: { label: 'Part' } } } })}>
        <Form
          schema={{ type: 'string', title: 'Birthday' }}
          uiSchema={{ 'ui:widget': 'alt-date' }}
          validator={validator}
        />
      </MantineProvider>,
    );

    const ids = Array.from(container.querySelectorAll('[id^="root"]'), (el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(screen.getByRole('combobox', { name: 'Birthday, year' })).toBeInTheDocument();
  });

  // React warns about, rather than renders, an unknown prop with a function or boolean value, and only once per prop, so
  // only the string, number and object values are checked here; the key list itself is checked by typecheck
  test('range widget keeps the InputWrapper and other input options off the slider root element', () => {
    const wrapperOptions = {
      descriptionProps: {},
      error: 'An error',
      errorProps: {},
      inputSize: 'md',
      inputWrapperOrder: ['label', 'input'],
      labelElement: 'div',
      labelProps: {},
      leftSection: 'Left',
      leftSectionPointerEvents: 'none',
      leftSectionProps: {},
      leftSectionWidth: 10,
      loadingPosition: 'left',
      rightSection: 'Right',
      rightSectionPointerEvents: 'none',
      rightSectionProps: {},
      rightSectionWidth: 10,
      success: 'Looks good',
      successProps: {},
      wrapperProps: {},
    };
    const { container } = renderField(
      { type: 'integer', title: 'A title' },
      { 'ui:widget': 'range', 'ui:options': wrapperOptions },
    );

    const root = container.querySelector('.mantine-Slider-root')!;
    expect(root).toBeInTheDocument();
    for (const name of Object.keys(wrapperOptions)) {
      expect(root).not.toHaveAttribute(name.toLowerCase());
    }
  });

  const titledWidgets: [string, string, RJSFSchema][] = [
    ['range', 'slider', { type: 'integer' }],
    ['alt-date', 'combobox', { type: 'string' }],
  ];
  const titleOptionSources = ['ui:options', 'ui:options.wrapperProps', 'theme', 'Input theme'];
  const titledCases = titledWidgets.flatMap(([widget, role, schema]) =>
    titleOptionSources.map((source) => [widget, source, role, schema] as [string, string, string, RJSFSchema]),
  );

  function themedForm(components: GenericObjectType, schema: RJSFSchema, uiSchema: UiSchema, formProps = {}) {
    return (
      <MantineProvider theme={createTheme({ components })}>
        <Form schema={schema} uiSchema={uiSchema} validator={validator} {...formProps} />
      </MantineProvider>
    );
  }

  /** Renders `widget` titled 'A title', with `props` set in `ui:options`, its `wrapperProps`, or the theme's
   * `InputWrapper` or `Input` `defaultProps`, as `source` names
   */
  function titledForm(widget: string, schema: RJSFSchema, source: string, props: GenericObjectType, formProps = {}) {
    const componentsBySource: Record<string, GenericObjectType> = {
      theme: { InputWrapper: { defaultProps: props } },
      'Input theme': { Input: { defaultProps: props } },
    };
    const components = componentsBySource[source] ?? {};
    const optionsBySource: Record<string, GenericObjectType> = {
      'ui:options': props,
      'ui:options.wrapperProps': { wrapperProps: props },
    };
    const options = optionsBySource[source];
    return themedForm(
      components,
      { ...schema, title: 'A title' },
      { 'ui:widget': widget, ...(options && { 'ui:options': options }) },
      formProps,
    );
  }

  test.each(titledCases)(
    '%s widget hides the field title but keeps it as the name when an inputWrapperOrder from the %s leaves the label out',
    (widget, source, role, schema) => {
      render(titledForm(widget, schema, source, { inputWrapperOrder: orderWithoutLabel }));

      expect(screen.getByText('A title')).not.toBeVisible();
      expect(screen.getAllByRole(role)[0]).toHaveAccessibleName(expect.stringMatching(/^A title/));
    },
  );

  test.each(titledCases)(
    '%s widget applies labelProps from the %s to the field title, except its id',
    (widget, source, role, schema) => {
      render(titledForm(widget, schema, source, { labelProps: { 'data-testid': 'title', id: 'mine' } }));

      expect(screen.getByTestId('title')).toHaveAttribute('id', titleId('root'));
      expect(screen.getAllByRole(role)[0]).toHaveAccessibleName(expect.stringMatching(/^A title/));
    },
  );

  test.each(titledCases)(
    '%s widget marks the field title required by a withAsterisk from the %s',
    (widget, source, _, schema) => {
      render(titledForm(widget, schema, source, { withAsterisk: true, labelProps: { 'data-testid': 'title' } }));

      expect(screen.getByTestId('title')).toHaveAttribute('data-required');
    },
  );

  test.each(titledCases)(
    '%s widget applies descriptionProps and errorProps from the %s to its description and errors',
    (widget, source, _, schema) => {
      render(
        titledForm(
          widget,
          { ...schema, description: 'A description' },
          source,
          { descriptionProps: { 'data-testid': 'description' }, errorProps: { 'data-testid': 'error' } },
          { extraErrors: { __errors: ['An error'] } },
        ),
      );

      expect(screen.getByTestId('description')).toHaveTextContent('A description');
      expect(screen.getByTestId('error')).toHaveTextContent('An error');
    },
  );

  test.each(titledWidgets)(
    '%s widget lays out its title, description and errors by inputWrapperOrder',
    (widget, _, schema) => {
      const { container } = render(
        titledForm(
          widget,
          { ...schema, description: 'A description' },
          'ui:options',
          { inputWrapperOrder: ['input', 'label', 'error'] },
          { extraErrors: { __errors: ['An error'] } },
        ),
      );

      const wrapper = container.querySelector('.mantine-InputWrapper-root')!;
      const label = wrapper.querySelector(`[id="${titleId('root')}"]`)!;
      expect(wrapper.firstElementChild!.compareDocumentPosition(label)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(label).toBeVisible();
      expect(wrapper).not.toHaveTextContent('A description');
      expect(wrapper).toHaveTextContent('An error');
    },
  );

  test.each(titledWidgets)(
    '%s widget prefers the field title options from its wrapperProps, then ui:options, then the theme, as inputs do',
    (widget, _, schema) => {
      const labelProps = (source: string) => ({ labelProps: { 'data-testid': 'title', 'data-source': source } });
      const { rerender } = render(titledForm(widget, schema, 'theme', labelProps('theme')));

      expect(screen.getByTestId('title')).toHaveAttribute('data-source', 'theme');

      const theme = { InputWrapper: { defaultProps: labelProps('theme') } };
      const titled = { ...schema, title: 'A title' };
      rerender(themedForm(theme, titled, { 'ui:widget': widget, 'ui:options': labelProps('ui:options') }));

      expect(screen.getByTestId('title')).toHaveAttribute('data-source', 'ui:options');

      rerender(
        themedForm(theme, titled, {
          'ui:widget': widget,
          'ui:options': { ...labelProps('ui:options'), wrapperProps: labelProps('wrapperProps') },
        }),
      );

      expect(screen.getByTestId('title')).toHaveAttribute('data-source', 'wrapperProps');
    },
  );

  test.each(
    titledWidgets.flatMap(([widget, , schema]) =>
      ['label', 'div'].map((labelElement) => [widget, labelElement, schema] as [string, string, RJSFSchema]),
    ),
  )('%s widget renders a title element %s with no for and no duplicate ids', (widget, labelElement, schema) => {
    const { container } = render(
      titledForm(widget, schema, 'ui:options', { labelElement, wrapperProps: { id: 'root' } }),
    );

    const title = container.querySelector(`[id="${titleId('root')}"]`)!;
    expect(title.tagName).toBe(labelElement.toUpperCase());
    expect(title).not.toHaveAttribute('for');
    const ids = Array.from(container.querySelectorAll('[id^="root"]'), (el) => el.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  test.each(titledCases)(
    '%s widget sizes its title, description and errors by a size from the %s',
    (widget, source, _, schema) => {
      const { container } = render(titledForm(widget, schema, source, { size: 'lg' }));

      expect(container.querySelector('.mantine-InputWrapper-root')).toHaveAttribute('data-size', 'lg');
      expect(
        (container.querySelector(`[id="${titleId('root')}"]`) as HTMLElement).style.getPropertyValue(
          '--input-label-size',
        ),
      ).toBe('var(--mantine-font-size-lg)');
    },
  );

  test.each(
    titledWidgets.flatMap(([widget, , schema]) =>
      (
        [
          ['Input theme', { className: 'theme-root', mod: { theme: true }, mt: 'xl' }],
          ['theme', { className: 'theme-root', mod: { theme: true }, mt: 'xl' }],
          [
            'Input theme',
            {
              classNames: { root: 'theme-root' },
              attributes: { root: { 'data-theme': true } },
              styles: { root: { marginTop: 20 } },
            },
          ],
        ] as [string, GenericObjectType][]
      ).map(([source, props]) => [widget, source, Object.keys(props).join(', '), schema, props]),
    ) as [string, string, string, RJSFSchema, GenericObjectType][],
  )(
    '%s widget applies root props from the %s (%s) once, to the wrapper of each input that renders one',
    (widget, source, _, schema, props) => {
      const { container } = render(titledForm(widget, schema, source, props));

      const fieldWrapper = container.querySelector<HTMLElement>(
        `.mantine-InputWrapper-root:has(> [id="${titleId('root')}"])`,
      )!;
      const partWrappers = Array.from(container.querySelectorAll<HTMLElement>('.mantine-InputWrapper-root')).filter(
        (wrapper) => wrapper !== fieldWrapper,
      );
      const rootPropsOf = (wrapper: HTMLElement) => [
        wrapper.classList.contains('theme-root'),
        wrapper.hasAttribute('data-theme'),
        !!wrapper.style.marginTop,
      ];
      const onField = widget === 'range';
      expect(rootPropsOf(fieldWrapper)).toEqual([onField, onField, onField]);
      expect(partWrappers.map(rootPropsOf)).toEqual(onField ? [] : Array(3).fill([true, true, true]));
    },
  );

  // `useFieldWrapperProps` keeps the theme's `InputWrapper` root props off the alt-date field wrapper by passing values
  // that render nothing, chosen by each style prop's type in Mantine's `STYLE_PROPS_DATA`. These tests fail when a Mantine
  // release adds a style prop type, makes a resolver reject those values, or otherwise lets a theme root prop through.
  const styleValueByType: Record<string, unknown> = {
    border: '1px solid red',
    color: 'red',
    fontFamily: 'mono',
    fontSize: 'lg',
    identity: 'inherit',
    lineHeight: 'md',
    radius: 'md',
    size: 10,
    spacing: 'md',
    textColor: 'blue',
  };

  test("covers every style prop type in Mantine's STYLE_PROPS_DATA", () => {
    const types = new Set(Object.values(STYLE_PROPS_DATA).map(({ type }) => type));

    expect(Object.keys(styleValueByType).sort()).toEqual([...types].sort());
  });

  test('alt-date widget keeps every InputWrapper theme root prop off its field wrapper, and on each part wrapper', () => {
    const rootProps = {
      ...Object.fromEntries(
        Object.entries(STYLE_PROPS_DATA).map(([name, { type }]) => [name, styleValueByType[type] ?? 'unknown type']),
      ),
      hiddenFrom: 'xs',
      visibleFrom: 'xs',
      lightHidden: true,
      darkHidden: true,
      className: 'theme-root',
      style: { outline: '1px solid red' },
      mod: { theme: true },
      classNames: { root: 'theme-root-slot' },
      styles: { root: { cursor: 'pointer' } },
      attributes: { root: { 'data-theme-slot': true } },
    };
    const baseline = render(titledForm('alt-date', { type: 'string' }, 'ui:options', {}));
    const baselineStyleCount = baseline.container.querySelectorAll('style').length;
    baseline.unmount();

    const { container } = render(titledForm('alt-date', { type: 'string' }, 'theme', rootProps));

    const fieldWrapper = container.querySelector(`.mantine-InputWrapper-root:has(> [id="${titleId('root')}"])`)!;
    expect(fieldWrapper).not.toHaveAttribute('style');
    expect(Array.from(fieldWrapper.classList).filter((name) => !name.startsWith('m_'))).toEqual([
      'mantine-InputWrapper-root',
    ]);
    expect(Array.from(fieldWrapper.attributes, ({ name }) => name).filter((name) => name.startsWith('data-'))).toEqual(
      [],
    );
    expect(container.querySelectorAll('style')).toHaveLength(baselineStyleCount);

    const partWrappers = Array.from(container.querySelectorAll<HTMLElement>('.mantine-InputWrapper-root')).filter(
      (wrapper) => wrapper !== fieldWrapper,
    );
    expect(partWrappers).toHaveLength(3);
    for (const wrapper of partWrappers) {
      expect(wrapper).toHaveClass('theme-root', 'theme-root-slot', 'mantine-light-hidden');
      expect(wrapper).toHaveAttribute('data-theme');
      expect(wrapper).toHaveAttribute('data-theme-slot');
      expect(wrapper.style.marginTop).not.toBe('');
      expect(wrapper.style.outline).not.toBe('');
      expect(wrapper.style.cursor).toBe('pointer');
    }
  });

  test.each(titledWidgets)(
    '%s widget applies root props from its ui:options.wrapperProps to the field wrapper',
    (widget, _, schema) => {
      const { container } = render(
        titledForm(widget, schema, 'ui:options.wrapperProps', { className: 'own-root', mod: { own: true }, mt: 'xl' }),
      );

      const fieldWrapper = container.querySelector<HTMLElement>(
        `.mantine-InputWrapper-root:has(> [id="${titleId('root')}"])`,
      )!;
      expect(fieldWrapper).toHaveClass('own-root');
      expect(fieldWrapper).toHaveAttribute('data-own');
      expect(fieldWrapper.style.marginTop).not.toBe('');
    },
  );

  test.each(titledWidgets)(
    '%s widget styles its title and errors by classNames from the Input theme, as Mantine inputs do',
    (widget, _, schema) => {
      const { container } = render(
        titledForm(
          widget,
          schema,
          'Input theme',
          { classNames: { label: 'theme-label', error: 'theme-error' } },
          { extraErrors: { __errors: ['An error'] } },
        ),
      );

      expect(container.querySelector(`[id="${titleId('root')}"]`)).toHaveClass('theme-label');
      expect(container.querySelector('.mantine-InputWrapper-error')).toHaveClass('theme-error');
    },
  );

  test.each(
    titledWidgets.flatMap(([widget, role, schema]) =>
      (
        [
          ['a hidden label', { title: 'A title' }, { 'ui:label': false }],
          ['a label left out of inputWrapperOrder', { title: 'A title' }, { inputWrapperOrder: orderWithoutLabel }],
        ] as [string, RJSFSchema, GenericObjectType][]
      ).map(([labelCase, titleSchema, options]) => [widget, labelCase, role, { ...schema, ...titleSchema }, options]),
    ) as [string, string, string, RJSFSchema, GenericObjectType][],
  )(
    '%s widget renders inside a single-child inputContainer, such as a Tooltip, with %s',
    (widget, _, role, schema, options) => {
      const { 'ui:label': uiLabel, ...uiOptions } = options;
      renderField(schema, {
        'ui:widget': widget,
        ...(uiLabel !== undefined && { 'ui:label': uiLabel }),
        'ui:options': {
          ...uiOptions,
          inputContainer: (children: ReactNode) => <Tooltip label='Tip'>{children}</Tooltip>,
        },
      });

      expect(screen.getAllByRole(role)[0]).toBeInTheDocument();
    },
  );

  test.each(['theme', 'ui:options', 'ui:options.wrapperProps'])(
    'alt-date widget renders an inputContainer from the %s around each part, not around them all',
    (source) => {
      const inputContainer = (children: ReactNode) => <div data-testid='container'>{children}</div>;
      render(titledForm('alt-date', { type: 'string' }, source, { inputContainer }));

      const containers = screen.getAllByTestId('container');
      expect(containers).toHaveLength(3);
      for (const [index, part] of screen.getAllByRole('combobox').entries()) {
        expect(containers[index]).toContainElement(part);
      }
    },
  );

  test.each([
    ...titledWidgets.map(([widget, , schema]) => [widget, schema] as [string, RJSFSchema]),
    ['text', { type: 'string' }],
    ['select', enumSchema],
    ['radio', enumSchema],
    ['checkboxes', checkboxesSchema],
  ] as [string, RJSFSchema][])('%s widget puts each error on its own line', (widget, schema) => {
    render(
      titledForm(
        widget,
        schema,
        'ui:options',
        { errorProps: { 'data-testid': 'error' } },
        { extraErrors: { __errors: ['First error', 'Second error'] } },
      ),
    );

    const error = screen.getByTestId('error');
    expect(error).toHaveTextContent('First error Second error');
    expect(error.querySelectorAll('br')).toHaveLength(1);
  });

  test.each(
    (
      [
        ['text', { type: 'string' }],
        ['textarea', { type: 'string' }],
        ['password', { type: 'string' }],
        ['color', { type: 'string' }],
        ['file', { type: 'string', format: 'data-url' }],
        ['date', { type: 'string' }],
        ['time', { type: 'string' }],
        ['select', enumSchema],
        ['radio', enumSchema],
        ['checkboxes', checkboxesSchema],
      ] as [string, RJSFSchema][]
    ).flatMap(([widget, schema]) =>
      ['ui:options', 'ui:options.wrapperProps', 'theme'].map((source) => [widget, source, schema]),
    ) as [string, string, RJSFSchema][],
  )(
    '%s widget applies descriptionProps from the %s to its description, rendered as a div',
    (widget, source, schema) => {
      render(
        titledForm(widget, { ...schema, description: 'A description' }, source, {
          descriptionProps: { 'data-testid': 'description' },
        }),
      );

      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('A description');
      expect(description.tagName).toBe('DIV');
    },
  );

  test('alt-date widget prefers its own wrapperProps.inputContainer over the theme wrapperProps one, as range does', () => {
    const themeContainer = (children: ReactNode) => <div data-testid='theme-container'>{children}</div>;
    const ownContainer = (children: ReactNode) => <div data-testid='own-container'>{children}</div>;
    for (const component of ['Input', 'Select']) {
      const { unmount } = render(
        themedForm(
          { [component]: { defaultProps: { wrapperProps: { inputContainer: themeContainer } } } },
          { type: 'string', title: 'A title' },
          { 'ui:widget': 'alt-date', 'ui:options': { wrapperProps: { inputContainer: ownContainer } } },
        ),
      );

      expect(screen.getAllByTestId('own-container')).toHaveLength(3);
      expect(screen.queryByTestId('theme-container')).not.toBeInTheDocument();
      unmount();
    }
  });

  test.each([
    ['ui:options.inputContainer', false],
    ['ui:options.wrapperProps.inputContainer', true],
  ] as [string, boolean][])(
    'alt-date widget renders each part with the theme Select wrapperProps given a %s',
    (_, inWrapperProps) => {
      const inputContainer = (children: ReactNode) => <div data-testid='container'>{children}</div>;
      const options = inWrapperProps ? { wrapperProps: { inputContainer } } : { inputContainer };
      const { container } = render(
        themedForm(
          { Select: { defaultProps: { wrapperProps: { 'data-part-wrapper': 'theme' } } } },
          { type: 'string', title: 'A title' },
          { 'ui:widget': 'alt-date', 'ui:options': options },
        ),
      );

      expect(screen.getAllByTestId('container')).toHaveLength(3);
      expect(container.querySelectorAll('[data-part-wrapper="theme"]')).toHaveLength(3);
    },
  );

  test('alt-date widget keeps the theme Select wrapperProps on each part given a ui:options.wrapperProps without an inputContainer', () => {
    const themeContainer = (children: ReactNode) => <div data-testid='theme-container'>{children}</div>;
    const { container } = render(
      themedForm(
        {
          Select: { defaultProps: { wrapperProps: { inputContainer: themeContainer, 'data-part-wrapper': 'theme' } } },
        },
        { type: 'string', title: 'A title' },
        { 'ui:widget': 'alt-date', 'ui:options': { wrapperProps: { 'data-field': 'x' } } },
      ),
    );

    expect(screen.getAllByTestId('theme-container')).toHaveLength(3);
    expect(container.querySelectorAll('[data-part-wrapper="theme"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-field="x"]')).toHaveLength(1);
  });

  test.each(['range', 'alt-date'])(
    '%s widget prefers a theme wrapperProps.inputContainer over a ui:options one, as Mantine inputs do',
    (widget) => {
      const themeContainer = (children: ReactNode) => <div data-testid='theme-container'>{children}</div>;
      const ownContainer = (children: ReactNode) => <div data-testid='own-container'>{children}</div>;
      render(
        themedForm(
          { Input: { defaultProps: { wrapperProps: { inputContainer: themeContainer } } } },
          { type: widget === 'range' ? 'integer' : 'string', title: 'A title' },
          { 'ui:widget': widget, 'ui:options': { inputContainer: ownContainer } },
        ),
      );

      expect(screen.getAllByTestId('theme-container')).toHaveLength(widget === 'range' ? 1 : 3);
      expect(screen.queryByTestId('own-container')).not.toBeInTheDocument();
    },
  );

  test('alt-date widget renders no part container when wrapperProps sets inputContainer to undefined, as a Select', () => {
    const themeContainer = (children: ReactNode) => <div data-testid='theme-container'>{children}</div>;
    const ownContainer = (children: ReactNode) => <div data-testid='own-container'>{children}</div>;
    render(
      themedForm(
        { Select: { defaultProps: { inputContainer: themeContainer } } },
        { type: 'string', title: 'A title' },
        {
          'ui:widget': 'alt-date',
          'ui:options': { inputContainer: ownContainer, wrapperProps: { inputContainer: undefined } },
        },
      ),
    );

    expect(screen.queryByTestId('theme-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('own-container')).not.toBeInTheDocument();
  });

  test.each(titledWidgets)(
    '%s widget renders one title when wrapperProps sets inputWrapperOrder to undefined, as Mantine uses its default',
    (widget, role, schema) => {
      const { container } = render(
        titledForm(widget, schema, 'ui:options', {
          inputWrapperOrder: orderWithoutLabel,
          wrapperProps: { inputWrapperOrder: undefined },
        }),
      );

      expect(container.querySelectorAll(`[id="${titleId('root')}"]`)).toHaveLength(1);
      expect(screen.getByText('A title')).toBeVisible();
      expect(screen.getAllByRole(role)[0]).toHaveAccessibleName(expect.stringMatching(/^A title/));
    },
  );

  test.each(titledWidgets)(
    '%s widget leaves the asterisk off a required field title when withAsterisk is false',
    (widget, _, schema) => {
      renderField(
        { type: 'object', required: ['field'], properties: { field: { ...schema, title: 'A title' } } },
        {
          field: { 'ui:widget': widget, 'ui:options': { withAsterisk: false, labelProps: { 'data-testid': 'title' } } },
        },
      );

      expect(screen.getByTestId('title')).not.toHaveAttribute('data-required');
    },
  );

  test('range widget keeps the slider thumb named by a thumbLabel from ui:options.thumbProps', () => {
    renderField(
      { type: 'integer', title: 'A title' },
      { 'ui:widget': 'range', 'ui:options': { thumbProps: { thumbLabel: 'Volume' } } },
    );

    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('slider')).toHaveAccessibleName('Volume');
  });

  test('range widget names the slider thumb by the title when ui:options.thumbProps unsets the thumbLabel', () => {
    renderField(
      { type: 'integer', title: 'A title' },
      { 'ui:widget': 'range', 'ui:options': { thumbLabel: 'Volume', thumbProps: { thumbLabel: undefined } } },
    );

    expect(screen.getByRole('slider')).toHaveAccessibleName('A title');
  });

  const selectWidgets: [string, RJSFSchema][] = [
    ['select', enumSchema],
    ['multi-select', checkboxesSchema],
  ];

  // Mantine's `Select` and `MultiSelect` build their listbox's label id from the `label` prop alone
  // (https://github.com/mantinedev/mantine/issues/9219). Skipped rather than expected to fail, so that the Mantine
  // release fixing it can be adopted without an unrelated failure; unskip it then, and drop the filter in
  // `labelCaseWidgets`.
  test.skip.each(selectWidgets)(
    '%s widget only references elements that exist when inputWrapperOrder leaves the label out',
    (_, schema) => {
      const { container } = renderField(
        { ...schema, title: 'A title' },
        { 'ui:options': { inputWrapperOrder: orderWithoutLabel } },
      );

      for (const el of container.querySelectorAll('[aria-labelledby]')) {
        for (const id of el.getAttribute('aria-labelledby')!.split(/\s+/)) {
          expect(container.querySelector(`[id="${id}"]`)).toBeInTheDocument();
        }
      }
    },
  );
});
