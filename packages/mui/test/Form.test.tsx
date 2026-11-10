import OutlinedInput from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import { withTheme } from '@rjsf/core';
import { getTestRegistry } from '@rjsf/core/testing';
import {
  checkboxLabelTests,
  fallbackDescriptionTests,
  formTests,
  optionErrorStateTests,
  submitPendingTests,
  themeTests,
  wrapIfAdditionalCallbackTests,
  wrapIfAdditionalErrorStateTests,
  wrapIfAdditionalFlagTests,
} from '@rjsf/snapshot-tests';
import type { FieldProps, FormValidation, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { TranslatableString, englishStringTranslator, errorId, fieldLabelId, helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';

import { elementOf } from '../../../testing/elementOf.ts';
import { expectReferencesResolve } from '../../../testing/expectReferencesResolve.ts';
import CheckboxesWidget from '../src/CheckboxesWidget/index.ts';
import CheckboxWidget from '../src/CheckboxWidget/index.ts';
import Form, { Theme, generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import RadioWidget from '../src/RadioWidget/index.ts';

const user = userEvent.setup();

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('typed form data', () => {
  interface Data {
    name?: string;
  }
  const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

  it('the default Form infers the form data type from formData', () => {
    const data: Data = { name: 'a' };
    const { container } = render(
      <Form
        schema={schema}
        validator={validator}
        initialFormData={data}
        onChange={({ formData }) => expectTypeOf(formData).toEqualTypeOf<Data>()}
      />,
    );
    expect(container.querySelector<HTMLInputElement>('#root_name')?.value).toBe('a');
  });

  it('the default Theme serves a typed withTheme() form', () => {
    const TypedForm = withTheme<Data>(Theme);
    const { container } = render(<TypedForm schema={schema} validator={validator} initialFormData={{ name: 'b' }} />);
    expect(container.querySelector<HTMLInputElement>('#root_name')?.value).toBe('b');
  });
});

describe('a pure anyOf union', () => {
  it('is named by its option selector alone, with no heading beside the options', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector('#root__anyof_select__inputLabel')).toHaveTextContent('Pet');
    expect(container.querySelector('#root__XxxOf__title')).not.toBeInTheDocument();
    expect(container.querySelector('#root__title')).toHaveTextContent('Dog');
  });

  it('is named by its heading, which it repeats nowhere, where it has properties beside the options', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      properties: { name: { type: 'string' } },
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(screen.getAllByText('Pet')).toHaveLength(1);
    expect(container.querySelector('#root__anyof_select__inputLabel')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });

  it('leaves the label to a custom field rendered beside the options', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          title: 'Foo',
          anyOf: [
            { title: 'Text', type: 'string' },
            { title: 'Number', type: 'number' },
          ],
        },
      },
    };
    const MyField = ({ presentation }: FieldProps) => <span>{presentation?.label.text}</span>;
    const { container } = render(
      <Form schema={schema} uiSchema={{ foo: { 'ui:field': MyField } }} validator={validator} />,
    );

    expect(screen.getAllByText('Foo')).toHaveLength(1);
    expect(container.querySelector('#root_foo__anyof_select__inputLabel')).not.toBeInTheDocument();
  });
});

describe("a titled anyOf field's option selector", () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: { pick: { title: 'Pick', anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }] } },
  };

  it("is a select named by its field's title", () => {
    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector('#root_pick__anyof_select')).toHaveAccessibleName('Pick');
    expectReferencesResolve(container);
  });

  it("is a radio group named by its field's label under ui:widget radio", () => {
    const { container } = render(
      <Form schema={schema} uiSchema={{ pick: { 'ui:widget': 'radio' } }} validator={validator} />,
    );

    const radioGroup = elementOf(container, '#root_pick__anyof_select__0').closest('[role="radiogroup"]');
    expect(radioGroup).toHaveAccessibleName('Pick');
    expect(radioGroup).toHaveAttribute('aria-labelledby', fieldLabelId('root_pick'));
    expectReferencesResolve(container);
  });
});

describe('an anyOf/oneOf field', () => {
  // The selector draws the field's label, which carries the field's one marker, but, picking an option index, which isn't
  // form data, isn't required; the selected option's control is required and its own label stays unmarked (#5573)
  test("marks a required field on the label its selector draws rather than its selected option's", () => {
    const { container } = render(
      <Form
        validator={validator}
        schema={{
          type: 'object',
          required: ['pet'],
          properties: {
            pet: {
              oneOf: [
                { title: 'Cat', type: 'string' },
                { title: 'Dog', type: 'number' },
              ],
            },
          },
        }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'pet' })).not.toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Cat' })).toBeRequired();
    expect(container.querySelectorAll('.MuiFormLabel-asterisk')).toHaveLength(1);
    expect(screen.getByText('pet')).toContainElement(container.querySelector('.MuiFormLabel-asterisk'));
    // The outline is notched to fit its label, marker included, so the `*` doesn't sit on the border
    const notches = [...container.querySelectorAll('fieldset[aria-hidden] legend')].map((legend) => legend.textContent);
    expect(notches).toEqual(['pet\u2009*', 'Cat']);
  });
});

describe('the fallback UI', () => {
  it('names the value control with the field title, and describes it once', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { title: 'X', description: 'An x', type: ['string', 'number'] } } }}
        initialFormData={{ x: 'a' }}
        validator={validator}
        useFallbackUiForUnsupportedType
      />,
    );

    expect(screen.getByLabelText('X')).toBe(container.querySelector('input#root_x'));
    expect(screen.getAllByText('An x')).toHaveLength(1);
  });
});

describe('a description', () => {
  const schema: RJSFSchema = {
    title: 'Pick',
    description: 'Field description',
    oneOf: [{ const: 'a', title: 'A', description: 'Option description' }],
  };

  test('draws as a plain block, not a heading, beside a selected option description', () => {
    const { container } = render(<Form schema={schema} initialFormData='a' validator={validator} />);

    expect(screen.queryByRole('heading')).toBeNull();
    expect(elementOf(container, '#root__description').tagName).toBe('DIV');
    expect(elementOf(container, '#root__selectedOptionDescription').tagName).toBe('DIV');
  });

  test("draws as the element ui:options.mui's descTypography names", () => {
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ 'ui:options': { mui: { rjsfSlotProps: { descTypography: { component: 'p' } } } } }}
        validator={validator}
      />,
    );

    expect(elementOf(container, '#root__description').tagName).toBe('P');
  });
});

describe('a checkbox whose presentation gives its description to the template', () => {
  test('draws the description once, from the template', () => {
    const { container } = render(
      <Form
        schema={{ type: 'boolean', title: 'Bee', description: 'Bee description' }}
        uiSchema={{ 'ui:widget': 'checkbox' }}
        presentation={{ widgets: { CheckboxWidget: { description: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('Bee description')).toHaveLength(1);
    expect(container.querySelector('#root__description')).toHaveTextContent('Bee description');
  });
});

describe("mui widgets carry their field's plan on the element a user focuses", () => {
  test.each<[string, string, RJSFSchema, UiSchema]>([
    ['text', 'textbox', { type: 'string' }, {}],
    ['textarea', 'textbox', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['updown', 'spinbutton', { type: 'number' }, { 'ui:widget': 'updown' }],
    ['range', 'slider', { type: 'number' }, { 'ui:widget': 'range' }],
    ['select', 'combobox', { type: 'string', enum: ['a', 'b'] }, {}],
    ['checkbox', 'checkbox', { type: 'boolean' }, {}],
  ])('a %s control is invalid and described only by elements that render', (_, role, schema, uiSchema) => {
    render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: uiSchema }}
        extraErrors={{ pet: { __errors: ['too short'] } }}
        validator={validator}
      />,
    );

    const control = screen.getByRole(role);
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAttribute('aria-describedby', 'root_pet__error');
    expect(control).toHaveAccessibleDescription('too short');
  });

  const colors: RJSFSchema = { type: 'string', title: 'Color', enum: ['red', 'blue'] };
  // ARIA supports `aria-invalid` on a `radiogroup` but not on a `group`, so a radio group carries it while each
  // checkbox carries its own
  test.each([
    ['radio', colors, 'radiogroup', 'radio', 'true', null],
    [
      'checkboxes',
      { type: 'array', title: 'Color', items: colors, uniqueItems: true },
      'group',
      'checkbox',
      null,
      'true',
    ],
  ] as const)(
    "marks a %s group or each option invalid, and describes each option by the field's errors",
    (widget, color, role, item, groupInvalid, optionInvalid) => {
      render(
        <Form
          schema={{ type: 'object', properties: { color } }}
          uiSchema={{ color: { 'ui:widget': widget } }}
          extraErrors={{ color: { __errors: ['pick one'] } }}
          validator={validator}
        />,
      );

      const group = screen.getByRole(role, { name: 'Color' });
      expect(group).toHaveAttribute('id', 'root_color');
      expect(group.getAttribute('aria-invalid')).toBe(groupInvalid);
      for (const option of screen.getAllByRole(item)) {
        expect(option.getAttribute('aria-invalid')).toBe(optionInvalid);
        expect(option).toHaveAttribute('aria-describedby', 'root_color__error');
        expect(option).toHaveAccessibleDescription('pick one');
      }
    },
  );
});

describe("mui widgets are named by their label and carry the field's id on the element a user focuses", () => {
  const widgets: [string, RJSFSchema, UiSchema, string, string][] = [
    ['text input', { type: 'string' }, {}, 'textbox', 'root_x'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, 'textbox', 'root_x'],
    ['checkbox', { type: 'boolean' }, {}, 'checkbox', 'root_x'],
    ['number input', { type: 'number' }, { 'ui:widget': 'updown' }, 'spinbutton', 'root_x'],
    ['slider', { type: 'number' }, { 'ui:widget': 'range' }, 'slider', 'root_x'],
    // The group's wrapper carries the field's id but isn't focusable, so focus goes to its first radio, as core's does
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, 'radiogroup', 'root_x__0'],
    [
      'checkboxes group',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      'group',
      'root_x__0',
    ],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, 'combobox', 'root_x'],
  ];

  test.each(widgets)("names a %s by its label, and gives it the field's id", (_, x, ui, role) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { ...x, title: 'X' } } }}
        uiSchema={{ x: ui }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { name: 'X' })).toHaveAttribute('id', 'root_x');
    expectReferencesResolve(container);
  });

  test.each(widgets)('names a deprecated %s by its label with the Deprecated marker', (_, x, ui, role) => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { ...x, title: 'X', deprecated: true } } }}
        uiSchema={{ x: ui }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { name: 'X (deprecated)' })).toHaveAttribute('id', 'root_x');
  });

  test.each(widgets)(
    'moves focus to a %s with errors when focusOnFirstError is set',
    async (_, x, ui, _role, focusedId) => {
      render(
        <Form
          schema={{ type: 'object', properties: { x: { ...x, title: 'X' } } }}
          uiSchema={{ x: ui }}
          validator={validator}
          focusOnFirstError
          customValidate={(_: unknown, errors: FormValidation<{ x?: unknown }>) => {
            errors.x?.addError('bad');
            return errors;
          }}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(document.activeElement).toHaveAttribute('id', focusedId);
    },
  );

  const letters: RJSFSchema = { type: 'string', title: 'X', enum: ['a', 'b'] };
  const groups: [string, RJSFSchema, string][] = [
    ['radio', letters, 'radiogroup'],
    ['checkboxes', { type: 'array', title: 'X', items: letters, uniqueItems: true }, 'group'],
  ];

  test.each(groups)('draws the label of a %s group with no for, which would name its wrapper', (widget, x, role) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x } }}
        uiSchema={{ x: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_x__label')).not.toHaveAttribute('for');
    expect(screen.getByRole(role, { name: 'X' })).toHaveAttribute('aria-labelledby', 'root_x__label');
  });

  test.each(groups)(
    "names a %s group whose label is hidden by the label's text, rather than by an id no element has",
    (widget, x) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { x } }}
          uiSchema={{ x: { 'ui:widget': widget, 'ui:label': false } }}
          validator={validator}
        />,
      );

      expect(container.querySelector('#root_x')).toHaveAccessibleName('X');
      expect(container.querySelector('#root_x')).not.toHaveAttribute('aria-labelledby');
    },
  );

  test.each<[string, string, RJSFSchema, UiSchema]>([
    ['text input', 'textbox', { type: 'string' }, {}],
    ['range', 'slider', { type: 'number' }, { 'ui:widget': 'range' }],
  ])('names a %s by the label text ui:label false hides', (_, role, schema, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: { ...uiSchema, 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.queryByText('Pet')).toBeNull();
    expect(screen.getByRole(role)).toHaveAccessibleName('Pet');
    expectReferencesResolve(container);
  });

  // The `Slider` puts the name it is given on the `<input>` the plan names, so the author's name is kept over the plan's
  test.each([
    ['ui:options.mui', { 'aria-label': 'Volume' }],
    ['the slider target', { rjsfSlotProps: { slider: { 'aria-label': 'Volume' } } }],
    ['getAriaLabel', { getAriaLabel: () => 'Volume' }],
  ])('names a slider by the name the form author gives it through %s, over the plan', (_, mui) => {
    render(
      <Form
        schema={{ type: 'object', properties: { pet: { type: 'number', title: 'Pet' } } }}
        uiSchema={{ pet: { 'ui:widget': 'range', 'ui:label': false, 'ui:options': { mui } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAccessibleName('Volume');
  });

  const text: RJSFSchema = { type: 'string', title: 'X' };
  const range: RJSFSchema = { type: 'number', title: 'X', minimum: 0, maximum: 10 };
  const bool: RJSFSchema = { type: 'boolean', title: 'X' };
  const several: RJSFSchema = { type: 'array', title: 'X', items: letters, uniqueItems: true };
  /** Nests `props` in `ui:options.mui` at `path` */
  const at =
    (...path: string[]) =>
    (props: object) =>
      path.reduceRight<object>((inner, key) => ({ [key]: inner }), props);
  const pickB = async () => {
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'b' }));
  };
  const press = (keys: string) => () => user.keyboard(keys);

  type HandlerRow = [string, RJSFSchema, UiSchema, (props: object) => object, unknown, () => Promise<void>, unknown];
  const checkboxInput = at('rjsfSlotProps', 'checkbox', 'slotProps', 'input');
  const radioInput = at('rjsfSlotProps', 'radio', 'slotProps', 'input');
  const sliderInput = at('rjsfSlotProps', 'slider', 'slotProps', 'input');
  const right = press('{ArrowRight}');
  /** Gives a select's select slot an `input` element carrying `props` */
  const selectInputElement = (props: object) => ({
    rjsfSlotProps: { select: { input: <OutlinedInput {...props} /> } },
  });

  /** Renders a field whose `ui:options.mui` gives author handlers at `mui`, acts on it, and checks the form still saw
   * the change, the focus and the blur
   *
   * @returns - The author's handlers
   */
  async function expectFormHandlersRun(...[, schema, uiSchema, mui, initialFormData, act, expected]: HandlerRow) {
    const author = { onChange: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn() };
    const onChange = vi.fn();
    const onFocus = vi.fn<(id: string, value: unknown) => void>();
    const onBlur = vi.fn<(id: string, value: unknown) => void>();
    render(
      <Form
        schema={schema}
        uiSchema={{ ...uiSchema, 'ui:options': { mui: mui(author) } }}
        validator={validator}
        initialFormData={initialFormData}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );

    await user.tab();
    await act();
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: expected }), 'root');
    expect(onFocus.mock.calls.map(([id]) => id)).toContain('root');
    expect(onBlur.mock.calls.map(([id]) => id)).toContain('root');
    return author;
  }

  // MUI gives these handlers to the control in place of the form's
  test.each<HandlerRow>([
    ['a text field', text, {}, at(), undefined, press('a'), 'a'],
    ["a text field's input slot", text, {}, at('slotProps', 'input'), undefined, press('a'), 'a'],
    ['a select', letters, {}, at(), 'a', pickB, 'b'],
    ["a select's select slot", letters, {}, at('rjsfSlotProps', 'select'), 'a', pickB, 'b'],
    ["a select's input slot", letters, {}, at('rjsfSlotProps', 'input'), 'a', pickB, 'b'],
    [
      "a select's select slot's display props",
      letters,
      {},
      at('rjsfSlotProps', 'select', 'SelectDisplayProps'),
      'a',
      pickB,
      'b',
    ],
    [
      "a select's select slot's inputProps' display props",
      letters,
      {},
      at('rjsfSlotProps', 'select', 'inputProps', 'SelectDisplayProps'),
      'a',
      pickB,
      'b',
    ],
    [
      "a select's input slot's inputProps' display props",
      letters,
      {},
      at('rjsfSlotProps', 'input', 'inputProps', 'SelectDisplayProps'),
      'a',
      pickB,
      'b',
    ],
    [
      "a select's htmlInput slot's display props",
      letters,
      {},
      at('rjsfSlotProps', 'htmlInput', 'SelectDisplayProps'),
      'a',
      pickB,
      'b',
    ],
    ["a select's select slot's input element", letters, {}, selectInputElement, 'a', pickB, 'b'],
    ['a checkbox', bool, {}, at('rjsfSlotProps', 'checkbox'), false, press(' '), true],
    ['a slider', range, { 'ui:widget': 'range' }, at(), 4, right, 5],
    ["a slider's target", range, { 'ui:widget': 'range' }, at('rjsfSlotProps', 'slider'), 4, right, 5],
    [
      "a slider's root slot",
      range,
      { 'ui:widget': 'range' },
      at('rjsfSlotProps', 'slider', 'slotProps', 'root'),
      4,
      right,
      5,
    ],
  ])("keeps %s's form data and focus reports over handlers ui:options.mui gives it", async (...row) => {
    const author = await expectFormHandlersRun(...row);
    expect(author.onChange).not.toHaveBeenCalled();
  });

  // MUI calls these handlers alongside the form's
  test.each<HandlerRow>([
    ["a text field's htmlInput slot", text, {}, at('slotProps', 'htmlInput'), undefined, press('a'), 'a'],
    ["a select's htmlInput slot", letters, {}, at('rjsfSlotProps', 'htmlInput'), 'a', pickB, 'b'],
    [
      "a text field's input slot's inputProps",
      text,
      {},
      at('slotProps', 'input', 'inputProps'),
      undefined,
      press('a'),
      'a',
    ],
    ["a select's input slot's inputProps", letters, {}, at('rjsfSlotProps', 'input', 'inputProps'), 'a', pickB, 'b'],
    ["a checkbox's input slot", bool, {}, checkboxInput, false, press(' '), true],
    ["a checkboxes option's input slot", several, { 'ui:widget': 'checkboxes' }, checkboxInput, [], press(' '), ['a']],
    ["a radio's input slot", letters, { 'ui:widget': 'radio' }, radioInput, undefined, press(' '), 'a'],
  ])("runs the handlers ui:options.mui gives %s beside the form's", async (...row) => {
    const author = await expectFormHandlersRun(...row);
    expect(author.onChange).toHaveBeenCalled();
    expect(author.onFocus).toHaveBeenCalled();
    expect(author.onBlur).toHaveBeenCalled();
  });

  type ValueRow = [string, RJSFSchema, UiSchema, object, unknown, () => Promise<void>, unknown, () => void];
  const showsQ = () => expect(screen.getByRole('textbox')).toHaveValue('q');
  const showsB = () => expect(screen.getByRole('combobox')).toHaveTextContent('b');
  const checksA = () => expect(screen.getByRole('radio', { name: 'a' })).toBeChecked();
  // The select's DOM value for `a`, which the combobox shows
  const pinA = { value: '0' };
  test.each<ValueRow>([
    ['a text field', text, {}, at()({ value: 'pinned' }), undefined, press('q'), 'q', showsQ],
    [
      "a text field's input slot",
      text,
      {},
      at('slotProps', 'input')({ value: 'pinned' }),
      undefined,
      press('q'),
      'q',
      showsQ,
    ],
    [
      "a text field's input slot's inputProps",
      text,
      {},
      at('slotProps', 'input', 'inputProps')({ value: 'pinned' }),
      undefined,
      press('q'),
      'q',
      showsQ,
    ],
    [
      "a text field's htmlInput slot",
      text,
      {},
      at('slotProps', 'htmlInput')({ value: 'pinned' }),
      undefined,
      press('q'),
      'q',
      showsQ,
    ],
    ['a select', letters, {}, at()(pinA), 'a', pickB, 'b', showsB],
    ["a select's select slot", letters, {}, at('rjsfSlotProps', 'select')(pinA), 'a', pickB, 'b', showsB],
    ["a select's htmlInput slot", letters, {}, at('rjsfSlotProps', 'htmlInput')(pinA), 'a', pickB, 'b', showsB],
    [
      "a select's select slot's inputProps",
      letters,
      {},
      at('rjsfSlotProps', 'select', 'inputProps')(pinA),
      'a',
      pickB,
      'b',
      showsB,
    ],
    [
      'a checkbox',
      bool,
      {},
      at('rjsfSlotProps', 'checkbox')({ checked: false }),
      false,
      press(' '),
      true,
      () => expect(screen.getByRole('checkbox')).toBeChecked(),
    ],
    [
      'a radio',
      letters,
      { 'ui:widget': 'radio' },
      at('rjsfSlotProps', 'radio')({ checked: false }),
      undefined,
      press(' '),
      'a',
      checksA,
    ],
    [
      "a radio's value",
      letters,
      { 'ui:widget': 'radio' },
      at('rjsfSlotProps', 'radio')({ value: 'pinned' }),
      undefined,
      press(' '),
      'a',
      checksA,
    ],
    [
      "a checkbox's input slot",
      bool,
      {},
      checkboxInput({ checked: false }),
      false,
      press(' '),
      true,
      () => expect(screen.getByRole('checkbox')).toBeChecked(),
    ],
    [
      "a radio's input slot",
      letters,
      { 'ui:widget': 'radio' },
      radioInput({ value: 'pinned' }),
      undefined,
      press(' '),
      'a',
      checksA,
    ],
    [
      "a radio's formControlLabel slot",
      letters,
      { 'ui:widget': 'radio' },
      at('rjsfSlotProps', 'formControlLabel')({ checked: false }),
      undefined,
      press(' '),
      'a',
      checksA,
    ],
    [
      "a slider's input slot",
      range,
      { 'ui:widget': 'range' },
      sliderInput({ value: 9 }),
      4,
      right,
      5,
      () => expect(screen.getByRole('slider')).toHaveValue('5'),
    ],
  ])(
    "shows %s's form data over a value ui:options.mui gives it",
    async (_, schema, uiSchema, mui, initial, act, expected, shows) => {
      const onChange = vi.fn();
      render(
        <Form
          schema={schema}
          uiSchema={{ ...uiSchema, 'ui:options': { mui } }}
          validator={validator}
          initialFormData={initial}
          onChange={onChange}
        />,
      );

      await user.tab();
      await act();

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: expected }), 'root');
      shows();
    },
  );

  test.each([
    ['checkbox slot', at('rjsfSlotProps', 'checkbox')],
    ['input slot', checkboxInput],
  ])("gives a checkbox's <input> the value its %s gives, which only native form submission reads", (_, mui) => {
    render(<Form schema={bool} uiSchema={{ 'ui:options': { mui: mui({ value: 'yes' }) } }} validator={validator} />);

    expect(screen.getByRole('checkbox')).toHaveAttribute('value', 'yes');
  });

  test.each([
    ['select slot', at('rjsfSlotProps', 'select', 'inputProps', 'SelectDisplayProps')],
    ['input slot', at('rjsfSlotProps', 'input', 'inputProps', 'SelectDisplayProps')],
    ['htmlInput slot', at('rjsfSlotProps', 'htmlInput', 'SelectDisplayProps')],
  ])("keeps the field's id on a select's combobox over display props its %s gives", (_, mui) => {
    render(<Form schema={letters} uiSchema={{ 'ui:options': { mui: mui({ title: 't' }) } }} validator={validator} />);

    expect(screen.getByRole('combobox')).toHaveAttribute('id', 'root');
  });

  test.each([
    ['select slot', at('rjsfSlotProps', 'select')],
    ["select slot's inputProps", at('rjsfSlotProps', 'select', 'inputProps')],
    ["input slot's inputProps", at('rjsfSlotProps', 'input', 'inputProps')],
    ['htmlInput slot', at('rjsfSlotProps', 'htmlInput')],
    ["select slot's slotProps.input", at('rjsfSlotProps', 'select', 'slotProps', 'input')],
    ["input slot's slotProps.input", at('rjsfSlotProps', 'input', 'slotProps', 'input')],
    ["select slot's MenuProps", at('rjsfSlotProps', 'select', 'MenuProps')],
  ])("keeps a read-only select's menu closed over an open its %s gives", (_, mui) => {
    render(
      <Form
        schema={letters}
        uiSchema={{ 'ui:readonly': true, 'ui:options': { mui: mui({ open: true, defaultOpen: true }) } }}
        validator={validator}
      />,
    );

    expect(screen.queryByRole('option')).toBeNull();
  });

  test('opens a select held open by its select slot once it is no longer read-only', () => {
    const uiSchema = (readonly: boolean): UiSchema => ({
      'ui:readonly': readonly,
      'ui:options': { mui: { rjsfSlotProps: { select: { open: true } } } },
    });
    const { rerender } = render(<Form schema={letters} uiSchema={uiSchema(true)} validator={validator} />);
    rerender(<Form schema={letters} uiSchema={uiSchema(false)} validator={validator} />);

    expect(screen.getAllByRole('option')).not.toHaveLength(0);
  });

  test("runs the onFocus and onBlur ui:options.mui gives a slider's input slot beside the form's", async () => {
    // An arrow key moves MUI's slider through its key handler, which fires no change on the input
    const author = await expectFormHandlersRun('', range, { 'ui:widget': 'range' }, sliderInput, 4, right, 5);
    expect(author.onFocus).toHaveBeenCalled();
    expect(author.onBlur).toHaveBeenCalled();
  });

  test.each<[string, RJSFSchema, UiSchema, (props: object) => object, string]>([
    ['a text field', text, {}, at(), 'textbox'],
    ["a text field's root slot", text, {}, at('slotProps', 'root'), 'textbox'],
    ["a text field's input slot", text, {}, at('slotProps', 'input'), 'textbox'],
    ["a text field's htmlInput slot", text, {}, at('slotProps', 'htmlInput'), 'textbox'],
    ["a text field's input slot's inputProps", text, {}, at('slotProps', 'input', 'inputProps'), 'textbox'],
    ["a text field's input slot's own input slot", text, {}, at('slotProps', 'input', 'slotProps', 'input'), 'textbox'],
    ["a slider through ui:inputType: 'range'", range, { 'ui:inputType': 'range' }, at(), 'slider'],
    ['a select', letters, {}, at(), 'combobox'],
    ["a select's root slot", letters, {}, at('rjsfSlotProps', 'root'), 'combobox'],
    ["a select's select slot", letters, {}, at('rjsfSlotProps', 'select'), 'combobox'],
    ["a select's select slot's input element", letters, {}, selectInputElement, 'combobox'],
    ["a select's select slot's inputProps", letters, {}, at('rjsfSlotProps', 'select', 'inputProps'), 'combobox'],
    [
      "a select's select slot's input slot",
      letters,
      {},
      at('rjsfSlotProps', 'select', 'slotProps', 'input'),
      'combobox',
    ],
    ["a select's input slot", letters, {}, at('rjsfSlotProps', 'input'), 'combobox'],
    ["a select's input slot's inputProps", letters, {}, at('rjsfSlotProps', 'input', 'inputProps'), 'combobox'],
    [
      "a select's input slot's own input slot",
      letters,
      {},
      at('rjsfSlotProps', 'input', 'slotProps', 'input'),
      'combobox',
    ],
    ["a select's htmlInput slot", letters, {}, at('rjsfSlotProps', 'htmlInput'), 'combobox'],
    ['a checkbox', bool, {}, at('rjsfSlotProps', 'checkbox'), 'checkbox'],
    ['a checkbox through its label', bool, {}, at(), 'checkbox'],
    ["a checkbox's label slot", bool, {}, at('rjsfSlotProps', 'formControlLabel'), 'checkbox'],
    ["a checkbox's input slot", bool, {}, at('rjsfSlotProps', 'checkbox', 'slotProps', 'input'), 'checkbox'],
    [
      "a checkboxes option's label slot",
      several,
      { 'ui:widget': 'checkboxes' },
      at('rjsfSlotProps', 'formControlLabel'),
      'checkbox',
    ],
    [
      "a checkboxes option's input slot",
      several,
      { 'ui:widget': 'checkboxes' },
      at('rjsfSlotProps', 'checkbox', 'slotProps', 'input'),
      'checkbox',
    ],
    ["a radio's label slot", letters, { 'ui:widget': 'radio' }, at('rjsfSlotProps', 'formControlLabel'), 'radio'],
    [
      "a radio's input slot",
      letters,
      { 'ui:widget': 'radio' },
      at('rjsfSlotProps', 'radio', 'slotProps', 'input'),
      'radio',
    ],
    ['a slider', range, { 'ui:widget': 'range' }, at(), 'slider'],
    ["a slider's target", range, { 'ui:widget': 'range' }, at('rjsfSlotProps', 'slider'), 'slider'],
    [
      "a slider's input slot",
      range,
      { 'ui:widget': 'range' },
      at('rjsfSlotProps', 'slider', 'slotProps', 'input'),
      'slider',
    ],
  ])('keeps %s read-only over a disabled: false in ui:options.mui', (_, schema, uiSchema, mui, role) => {
    render(
      <Form
        schema={schema}
        uiSchema={{ ...uiSchema, 'ui:readonly': true, 'ui:options': { mui: mui({ disabled: false }) } }}
        validator={validator}
      />,
    );

    for (const control of screen.getAllByRole(role)) {
      // MUI's select is a `<div>` combobox, which marks itself disabled through ARIA
      expect(control.matches(':disabled') || control.getAttribute('aria-disabled') === 'true').toBe(true);
    }
  });

  test.each([
    ['htmlInput slot', at('rjsfSlotProps', 'htmlInput')],
    ["select slot's inputProps", at('rjsfSlotProps', 'select', 'inputProps')],
    ["select slot's display props", at('rjsfSlotProps', 'select', 'SelectDisplayProps')],
    ["input slot's inputProps", at('rjsfSlotProps', 'input', 'inputProps')],
  ])("keeps a read-only select out of the keyboard's reach over a tabIndex its %s gives", async (_, mui) => {
    render(
      <Form
        schema={letters}
        uiSchema={{ 'ui:readonly': true, 'ui:options': { mui: mui({ tabIndex: 0 }) } }}
        validator={validator}
      />,
    );

    await user.tab();
    await user.keyboard(' ');

    expect(screen.getByRole('combobox')).not.toHaveFocus();
    expect(screen.queryByRole('option')).toBeNull();
  });

  // MUI takes a slot whose `(ownerState) => props` returns nothing
  test.each<[string, RJSFSchema, UiSchema, (props: object) => object, string]>([
    ["a text field's htmlInput slot", text, {}, at('slotProps', 'htmlInput'), 'textbox'],
    ["a select's htmlInput slot", letters, {}, at('rjsfSlotProps', 'htmlInput'), 'combobox'],
    ["a checkbox's input slot", bool, {}, at('rjsfSlotProps', 'checkbox', 'slotProps', 'input'), 'checkbox'],
    [
      "a slider's input slot",
      range,
      { 'ui:widget': 'range' },
      at('rjsfSlotProps', 'slider', 'slotProps', 'input'),
      'slider',
    ],
  ])('draws %s given as a function that returns no props', (_, schema, uiSchema, mui, role) => {
    render(
      <Form
        schema={schema}
        uiSchema={{ ...uiSchema, 'ui:options': { mui: mui(() => undefined) } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role)).toBeInTheDocument();
  });

  test("reports a slider's value to the form's onFocus and onBlur, rather than its input's string", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Form
        schema={range}
        uiSchema={{ 'ui:widget': 'range' }}
        validator={validator}
        initialFormData={4}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );

    await user.tab();
    await user.tab();

    expect(onFocus).toHaveBeenCalledWith('root', 4);
    expect(onBlur).toHaveBeenCalledWith('root', 4);
  });

  // A required field asks for one checkbox, not each, while a radio is required, as core's are
  test.each([
    ['checkboxes', { type: 'array', title: 'X', items: letters, uniqueItems: true, minItems: 1 }, 'checkbox', false],
    ['radio', letters, 'radio', true],
  ] as const)('requires each option of a required %s group only where core does', (widget, x, item, required) => {
    render(
      <Form
        schema={{ type: 'object', properties: { x }, required: ['x'] }}
        uiSchema={{ x: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    for (const option of screen.getAllByRole(item)) {
      expect((option as HTMLInputElement).required).toBe(required);
    }
    // MUI's `FormControlLabel` marks the label of an option whose control is `required`
    expect(screen.getAllByText('*')).toHaveLength(1);
  });

  test("writes a string field's slider value as a string, which keeps it valid", async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'string', minimum: 0, maximum: 10 }}
        uiSchema={{ 'ui:widget': 'RangeWidget' }}
        validator={validator}
        initialFormData='7'
        liveValidate='onChange'
        onChange={onChange}
      />,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: '8', errors: [] }), 'root');
  });

  test('requires the slider of a required range field, as core does', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } }, required: ['x'] }}
        uiSchema={{ x: { 'ui:widget': 'range' } }}
        validator={validator}
      />,
    );

    // jest-dom's `toBeRequired` doesn't count `required` on a range input, which a browser ignores
    expect(screen.getByRole('slider', { name: 'X' })).toHaveAttribute('required');
  });

  test("focuses the slider's input under ui:autofocus, as core does", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider', { name: 'X' })).toHaveFocus();
  });

  test("focuses a radio group's first radio under ui:autofocus, as core does", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'string', title: 'X', enum: ['a', 'b'] } } }}
        uiSchema={{ x: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('radio')[0]).toHaveFocus();
  });

  test("keeps the slider's label off its root, which takes no label", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range' } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.MuiSlider-root')).not.toHaveAttribute('label');
  });

  test.each([
    ['top-level', { slotProps: { input: { 'data-testid': 'thumb-input' } } }],
    ['slider target', { rjsfSlotProps: { slider: { slotProps: { input: { 'data-testid': 'thumb-input' } } } } }],
  ])("applies the slider's %s slotProps beside the field's id and plan", (_, mui) => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'number', title: 'X' } } }}
        uiSchema={{ x: { 'ui:widget': 'range', 'ui:options': { mui } } }}
        validator={validator}
      />,
    );

    expect(screen.getByTestId('thumb-input')).toHaveAttribute('id', 'root_x');
  });

  test("names an additional property's key input by its label", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        initialFormData={{ foo: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'foo Key' })).toHaveAttribute('id', 'root_foo__key');
    expectReferencesResolve(container);
  });

  test("names an additional property's key input by its label's text where ui:label: false leaves it unlabelled", () => {
    render(
      <Form
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        uiSchema={{ additionalProperties: { 'ui:label': false } }}
        initialFormData={{ foo: 'bar' }}
        validator={validator}
      />,
    );

    expect(document.getElementById('root_foo__key')).toHaveAccessibleName('foo Key');
  });

  test('draws a thumb for each numeric string of a range of several values', () => {
    const { RangeWidget } = generateWidgets();
    render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', items: { type: 'string' } } } }}
        // The `range` name is registered for numbers alone, so an array is handed the widget itself
        uiSchema={{ r: { 'ui:widget': RangeWidget } }}
        initialFormData={{ r: ['2', '5'] }}
        validator={validator}
      />,
    );

    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute('aria-valuenow', '2');
    expect(thumbs[1]).toHaveAttribute('aria-valuenow', '5');
  });

  test('writes each part of a range of numeric strings as a string, which keeps it valid', async () => {
    const { RangeWidget } = generateWidgets();
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', items: { type: 'string' } } } }}
        uiSchema={{ r: { 'ui:widget': RangeWidget } }}
        initialFormData={{ r: ['2', '5'] }}
        validator={validator}
        liveValidate='onChange'
        onChange={onChange}
      />,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { r: ['3', '5'] }, errors: [] }),
      'root_r',
    );
  });

  test.each([
    ['no data', undefined, 1, [0, 1]],
    ['an unset part', [null, 5], 0, [1, 5]],
  ])(
    'keeps a thumb for each part of a range of several values with %s, drawing an unset one at the minimum',
    async (_, r, moved, written) => {
      const { RangeWidget } = generateWidgets();
      const onChange = vi.fn();
      render(
        <Form
          schema={{ type: 'object', properties: { r: { type: 'array', minItems: 2, items: { type: 'number' } } } }}
          uiSchema={{ r: { 'ui:widget': RangeWidget } }}
          initialFormData={r === undefined ? undefined : { r }}
          validator={validator}
          onChange={onChange}
        />,
      );

      const thumbs = screen.getAllByRole('slider');
      expect(thumbs).toHaveLength(2);
      expect(thumbs[0]).toHaveAttribute('aria-valuenow', '0');
      await user.keyboard('{Tab}'.repeat(moved + 1));
      expect(thumbs[moved]).toHaveFocus();
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { r: written } }), 'root_r');
    },
  );

  test("draws an unset part of a range of several values at its item's minimum, which moving another part writes", async () => {
    const { RangeWidget } = generateWidgets();
    const onChange = vi.fn();
    render(
      <Form
        schema={{
          type: 'object',
          properties: { r: { type: 'array', minItems: 2, items: { type: 'number', minimum: 2, maximum: 9 } } },
        }}
        uiSchema={{ r: { 'ui:widget': RangeWidget } }}
        initialFormData={{ r: [null, 5] }}
        validator={validator}
        onChange={onChange}
      />,
    );

    const thumbs = screen.getAllByRole('slider');
    expect(thumbs[0]).toHaveAttribute('aria-valuenow', '2');
    await user.keyboard('{Tab}{Tab}{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { r: [2, 6] } }), 'root_r');
  });

  test("keeps the field's id on the slider's root for a range of several values, whose every thumb takes its input slot", () => {
    const { RangeWidget } = generateWidgets();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', items: { type: 'number' } } } }}
        // The `range` name is registered for numbers alone, so an array is handed the widget itself
        uiSchema={{ r: { 'ui:widget': RangeWidget } }}
        initialFormData={{ r: [10, 20] }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(container.querySelectorAll('[id="root_r"]')).toHaveLength(1);
    expect(container.querySelector('.MuiSlider-root')).toHaveAttribute('id', 'root_r');
  });

  test('names each thumb of a range of several values by its label and number, the label having no `for` naming the root', () => {
    const { RangeWidget } = generateWidgets();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', title: 'Span', items: { type: 'number' } } } }}
        uiSchema={{ r: { 'ui:widget': RangeWidget } }}
        initialFormData={{ r: [10, 20] }}
        validator={validator}
      />,
    );

    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAccessibleName('Span (1)');
    expect(thumbs[1]).toHaveAccessibleName('Span (2)');
    expect(container.querySelector('label[for="root_r"]')).not.toBeInTheDocument();
    expectReferencesResolve(container);
  });

  describe('numbers the thumbs of a range of several values', () => {
    const { RangeWidget } = generateWidgets();
    const span: RJSFSchema = {
      type: 'object',
      properties: { r: { type: 'array', title: 'Span', items: { type: 'number' } } },
    };

    test.each<[string, RJSFSchema, UiSchema]>([
      ['by the text of a label ui:label hides', span, { r: { 'ui:widget': RangeWidget, 'ui:label': false } }],
      [
        'by the text of the field above when both hide their label',
        {
          type: 'object',
          properties: { r: { title: 'Span', anyOf: [{ title: 'Pair', type: 'array', items: { type: 'number' } }] } },
        },
        { r: { 'ui:label': false, anyOf: [{ 'ui:widget': RangeWidget, 'ui:label': false }] } },
      ],
      [
        'when the author sets getAriaLabel to undefined',
        span,
        { r: { 'ui:widget': RangeWidget, 'ui:options': { mui: { getAriaLabel: undefined } } } },
      ],
    ])('%s', (_, schema, uiSchema) => {
      render(<Form schema={schema} uiSchema={uiSchema} initialFormData={{ r: [10, 20] }} validator={validator} />);

      const thumbs = screen.getAllByRole('slider');
      expect(thumbs[0]).toHaveAccessibleName('Span (1)');
      expect(thumbs[1]).toHaveAccessibleName('Span (2)');
    });
  });

  test('gives the thumbs of a range of several values no bare number when the field has no label text', () => {
    const { RangeWidget } = generateWidgets();
    render(
      <Form
        schema={{ type: 'array', items: { type: 'number' } }}
        uiSchema={{ 'ui:widget': RangeWidget }}
        initialFormData={[10, 20]}
        validator={validator}
      />,
    );

    screen.getAllByRole('slider').forEach((thumb) => expect(thumb).not.toHaveAttribute('aria-label'));
  });

  test('names the lone thumb of a one-value range by its label, without a number', () => {
    const { RangeWidget } = generateWidgets();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', title: 'Span', items: { type: 'number' } } } }}
        uiSchema={{ r: { 'ui:widget': RangeWidget } }}
        initialFormData={{ r: [10] }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAccessibleName('Span');
    expectReferencesResolve(container);
  });

  test.each([
    ['aria-label', { 'aria-label': 'Volume' }, ['Volume', 'Volume']],
    ['getAriaLabel', { getAriaLabel: (index: number) => `Bound ${index}` }, ['Bound 0', 'Bound 1']],
    ['the input slot', { slotProps: { input: { 'aria-label': 'Volume' } } }, ['Volume', 'Volume']],
  ])('leaves the thumbs of a range of several values to the name the author gives through %s', (_, mui, names) => {
    const { RangeWidget } = generateWidgets();
    render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', title: 'Span', items: { type: 'number' } } } }}
        uiSchema={{ r: { 'ui:widget': RangeWidget, 'ui:options': { mui } } }}
        initialFormData={{ r: [10, 20] }}
        validator={validator}
      />,
    );

    const thumbs = screen.getAllByRole('slider');
    names.forEach((name, index) => expect(thumbs[index]).toHaveAccessibleName(name));
  });

  test('names the thumbs of a range of several values by their label alone when translateString leaves the number format empty', () => {
    const { RangeWidget } = generateWidgets();
    render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', title: 'Span', items: { type: 'number' } } } }}
        uiSchema={{ r: { 'ui:widget': RangeWidget } }}
        initialFormData={{ r: [10, 20] }}
        validator={validator}
        translateString={(key, params) =>
          key === TranslatableString.ItemNameWithNumber ? '' : englishStringTranslator(key, params)
        }
      />,
    );

    screen.getAllByRole('slider').forEach((thumb) => expect(thumb).toHaveAccessibleName('Span'));
  });

  test('focuses the first thumb of a range of several values under ui:autofocus', () => {
    const { RangeWidget } = generateWidgets();
    render(
      <Form
        schema={{ type: 'object', properties: { r: { type: 'array', title: 'Span', items: { type: 'number' } } } }}
        uiSchema={{ r: { 'ui:widget': RangeWidget, 'ui:autofocus': true } }}
        initialFormData={{ r: [10, 20] }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('slider')[0]).toHaveFocus();
  });

  test("names an additional property's key select by its label, and describes it by no id that is missing", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', propertyNames: { enum: ['foo', 'bar'] }, additionalProperties: { type: 'string' } }}
        initialFormData={{ foo: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'foo Key' })).not.toHaveAttribute('aria-describedby');
    expectReferencesResolve(container);
  });
});

describe('mui SelectWidget', () => {
  test.each<[string, RJSFSchema]>([
    ['an untitled anyOf selector', { anyOf: [{ type: 'string' }, { type: 'number' }] }],
    ['a select whose field has no title or name', { type: 'string', enum: ['foo', 'bar'] }],
  ])('names %s by the translated prompt where no label names it', (_, schema) => {
    render(<Form schema={schema} validator={validator} />);

    expect(screen.getAllByRole('combobox')[0]).toHaveAccessibleName('Select ...');
  });
});

describe('mui CheckboxWidget', () => {
  test('draws no label of its own where ui:label turns it off', () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'boolean', title: 'X' } } }}
        uiSchema={{ x: { 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.queryByText('X')).not.toBeInTheDocument();
  });
});

describe('mui FieldTemplate', () => {
  const TextWidget = ({ id }: WidgetProps) => <input id={id} />;

  test.each([
    ['a required', ['foo'], true],
    ['an optional', [], false],
  ])("draws the label of %s field whose widget's declaration leaves it to the template", (_, required, marked) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'string', title: 'Foo' } }, required }}
        uiSchema={{ foo: { 'ui:widget': 'TextWidget' } }}
        widgets={{ TextWidget }}
        presentation={{ widgets: { TextWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    const label = container.querySelector('label[for="root_foo"]');
    expect(label).toHaveAttribute('id', 'root_foo__label');
    expect(label).toHaveTextContent(marked ? /^Foo\s*\*$/ : /^Foo$/);
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Foo');
  });

  // MUI's `FormControl` hands its `required` to a `FormLabel` inside it that doesn't set its own
  test('marks a switch declared to hold false unchecked only where the schema demands true', () => {
    const SwitchWidget = ({ id }: WidgetProps) => <Switch id={id} />;
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'boolean', title: 'Foo' } }, required: ['foo'] }}
        uiSchema={{ foo: { 'ui:widget': 'SwitchWidget' } }}
        widgets={{ SwitchWidget }}
        presentation={{ widgets: { SwitchWidget: { label: 'template', uncheckedIsFalse: true } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('label[for="root_foo"]')).toHaveTextContent(/^Foo$/);
    expect(screen.getByRole('switch')).not.toBeRequired();
  });

  test("draws the template's label for a radio group with no for, which would name the group's wrapper", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio' } }}
        presentation={{ widgets: { RadioWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_color__label')).not.toHaveAttribute('for');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Color');
  });

  test("names a select declared to leave its label to the template by that label, through MUI's labelId", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['a', 'b'] } } }}
        presentation={{ widgets: { SelectWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Color' })).toBeInTheDocument();
    expectReferencesResolve(container);
  });

  // The plan gives a template label no part where there is no control to name, as while an optional field has no data
  test('draws no label for an optional anyOf field with no data, though it leaves its label to the template', () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            pet: {
              type: 'object',
              title: 'Pet',
              anyOf: [
                { title: 'Dog', properties: { name: { type: 'string' } } },
                { title: 'Cat', properties: { lives: { type: 'number' } } },
              ],
            },
          },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        presentation={{ fields: { AnyOfField: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_pet__label')).not.toBeInTheDocument();
    expect(screen.queryByText('Pet', { selector: 'label' })).not.toBeInTheDocument();
  });

  test('draws no label for a widget that draws its own', () => {
    const { container } = render(<Form schema={{ type: 'string', title: 'Foo' }} validator={validator} />);

    // MUI's outlined input repeats its label's text in the hidden `<legend>` of its notch
    expect(screen.getAllByText('Foo', { selector: 'label' })).toHaveLength(1);
    expect(container.querySelector('#root__label')).not.toBeInTheDocument();
  });
});

describe('mui TitleField', () => {
  test("names an object's option selector by its heading's text, without the marker or optional data control", () => {
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            pet: {
              type: 'object',
              title: 'Pet',
              properties: { name: { type: 'string' } },
              anyOf: [
                { title: 'Dog', properties: { bark: { type: 'string' } } },
                { title: 'Cat', properties: { meow: { type: 'string' } } },
              ],
            },
          },
          required: ['pet'],
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        initialFormData={{ pet: { name: 'Rex' } }}
        validator={validator}
      />,
    );

    const heading = screen.getByRole('heading', { name: 'Pet' });
    expect(heading).toHaveTextContent(/^Pet\s*\*$/);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });
});

describe('mui labels the core widgets that draw no label of their own', () => {
  test("labels core's RatingWidget from the template, naming its radiogroup", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { score: { type: 'integer', title: 'Score', maximum: 3 } } }}
        uiSchema={{ score: { 'ui:widget': 'RatingWidget' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Score');
    expectReferencesResolve(container);
  });

  test.each(['alt-date', 'alt-datetime'])('labels a %s field from the template, with no `for`', (widget) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
        uiSchema={{ when: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    const label = document.getElementById('root_when__label');
    expect(label).toHaveTextContent('When');
    expect(label).not.toHaveAttribute('for');
    container.querySelectorAll('label[for]').forEach((labelFor) => {
      expect(container.querySelector(`[id="${labelFor.getAttribute('for')}"]`)).toBeInTheDocument();
    });
    expect(screen.getByRole('group', { name: 'When' })).toHaveAttribute('id', 'root_when');
  });
});

describe('mui ArrayFieldTemplate', () => {
  test("draws no heading for an array option whose ui:title repeats its field's label", () => {
    render(
      <Form
        schema={{
          type: 'object',
          properties: {
            tags: { type: 'array', items: { type: 'string' }, anyOf: [{ maxItems: 3 }, { minItems: 1 }] },
          },
        }}
        uiSchema={{ tags: { 'ui:title': 'Tags', anyOf: [{ 'ui:title': 'Tags' }, {}] } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Tags');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test("keeps an optional array's data control where it draws no heading", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { tags: { type: 'array', title: 'Tags', items: { type: 'string' } } } }}
        uiSchema={{ tags: { 'ui:label': false }, 'ui:globalOptions': { enableOptionalDataFieldForType: ['array'] } }}
        initialFormData={{ tags: ['a'] }}
        validator={validator}
      />,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('#root_tags__optionalRemove')).toBeInTheDocument();
  });
});

describe('mui ObjectFieldTemplate', () => {
  test("keeps an optional object's data control where ui:label turns its heading off", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { pet: { type: 'object', title: 'Pet', properties: { a: { type: 'string' } } } },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] }, pet: { 'ui:label': false } }}
        initialFormData={{ pet: { a: 'x' } }}
        validator={validator}
      />,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('#root_pet__optionalRemove')).toBeInTheDocument();
  });
});

describe("mui's error and help elements carry the ids their field's plan describes its control by", () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      pet: {
        title: 'Pet',
        anyOf: [
          { title: 'Dog', type: 'string' },
          { title: 'Cat', type: 'number' },
        ],
      },
    },
  };

  test("renders an option's own help under its own id, beside the field's", () => {
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ pet: { 'ui:help': 'Pick a pet', anyOf: [{ 'ui:help': 'Dogs bark' }, {}] } }}
        validator={validator}
      />,
    );

    expect(container.querySelectorAll(`#${helpId('root_pet')}`)).toHaveLength(1);
    expect(container.querySelector(`#${helpId('root_pet')}`)).toHaveTextContent('Pick a pet');
    expect(container.querySelector(`#${optionHelpId('root_pet')}`)).toHaveTextContent('Dogs bark');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Dogs bark Pick a pet');
  });

  test("renders an anyOf field's errors once, under the id its control is described by", () => {
    const { container } = render(
      <Form schema={schema} extraErrors={{ pet: { __errors: ['pick one', 'or another'] } }} validator={validator} />,
    );

    expect(container.querySelectorAll(`#${errorId('root_pet')}`)).toHaveLength(1);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('pick one or another');
  });
});

describe('mui focuses its groups as core does', () => {
  test.each<[string, RJSFSchema, string]>([
    ['radio', { type: 'string', enum: ['red', 'green'] }, 'radio'],
    ['checkboxes', { type: 'array', items: { type: 'string', enum: ['red', 'green'] }, uniqueItems: true }, 'checkbox'],
  ])('focuses the first %s a user can choose under ui:autofocus', (widget, color, role) => {
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        uiSchema={{ color: { 'ui:widget': widget, 'ui:autofocus': true, 'ui:enumDisabled': ['red'] } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole(role)[1]).toHaveFocus();
  });

  test("focuses a radio group's checked radio under ui:autofocus, where Tab into the group lands", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', enum: ['red', 'green', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        initialFormData={{ color: 'blue' }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('radio')[2]).toHaveFocus();
  });
});

// HTML5 constraint validation fails an unchecked required box and blocks the submit before RJSF sees it, so neither
// onSubmit nor onError runs and the browser asks the user to check a box the schema lets them leave unchecked. Only a
// required boolean the schema demands be true carries the attribute (#5388)
describe('mui CheckboxWidget required attribute', () => {
  const agree: RJSFSchema = { type: 'boolean', title: 'Agree' };
  const formSchema = (field: RJSFSchema): RJSFSchema => ({
    type: 'object',
    required: ['agree'],
    properties: { agree: field },
  });

  test('submits a required boolean left unchecked, whose false the schema accepts', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Form schema={formSchema(agree)} validator={validator} onSubmit={onSubmit} onError={onError} />,
    );

    expect(container.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { agree: false } }),
      expect.anything(),
    );
  });

  test('keeps the attribute on a required boolean that has to be true', () => {
    const { container } = render(<Form schema={formSchema({ ...agree, const: true })} validator={validator} />);

    expect(container.querySelector('input[type=checkbox]')).toHaveAttribute('required');
  });

  // Rendered without a plan, as outside SchemaField, the widget gets its parent's `required` as is, so the attribute
  // has to follow both it and the schema: a required box whose `false` the schema accepts, and an optional one that
  // has to be true but is left unanswered, each hold data the schema accepts, which the browser would refuse
  test.each<[string, RJSFSchema, boolean, boolean | undefined]>([
    ['a required boolean whose false the schema accepts', agree, true, false],
    ['an optional boolean that has to be true', { ...agree, const: true }, false, undefined],
  ])('leaves the attribute off %s, rendered without a plan', (_, schema, required, value) => {
    const { container } = render(
      <CheckboxWidget
        id='root'
        name='root'
        schema={schema}
        uiSchema={{}}
        value={value}
        required={required}
        disabled={false}
        readonly={false}
        autofocus={false}
        label='Agree'
        options={{}}
        onChange={vi.fn()}
        onBlur={vi.fn()}
        onFocus={vi.fn()}
        registry={getTestRegistry(schema)}
      />,
    );

    expect(container.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');
  });

  test('keeps a box rendered with no disabled or readonly editable over a disabled its checkbox slot gives', () => {
    render(
      <CheckboxWidget
        id='root'
        name='root'
        schema={agree}
        uiSchema={{}}
        value={false}
        required={false}
        autofocus={false}
        label='Agree'
        options={{ mui: { rjsfSlotProps: { checkbox: { disabled: true } } } }}
        onChange={vi.fn()}
        onBlur={vi.fn()}
        onFocus={vi.fn()}
        registry={getTestRegistry(agree)}
      />,
    );

    expect(screen.getByRole('checkbox')).toBeEnabled();
  });

  test.each([
    ['checkboxes', CheckboxesWidget, 'checkbox', 'checkbox'],
    ['radio', RadioWidget, 'radio', 'radio'],
  ] as const)(
    'keeps a %s option rendered with no disabled or readonly editable over a disabled its slot gives',
    (_, Widget, slot, role) => {
      const letters: RJSFSchema = { type: 'string', enum: ['a'] };
      render(
        <Widget
          id='root'
          name='root'
          schema={letters}
          uiSchema={{}}
          value={undefined}
          required={false}
          autofocus={false}
          label='Letter'
          options={{
            enumOptions: [{ value: 'a', label: 'a' }],
            mui: { rjsfSlotProps: { [slot]: { disabled: true } } },
          }}
          onChange={vi.fn()}
          onBlur={vi.fn()}
          onFocus={vi.fn()}
          registry={getTestRegistry(letters)}
        />,
      );

      expect(screen.getByRole(role)).toBeEnabled();
    },
  );
});

describe('mui renderToString and hydration (#4083)', () => {
  it('renders the dependency a default selects with renderToString under jsdom, and hydrates without a mismatch', () => {
    const schema: RJSFSchema = {
      definitions: {
        guest: {
          type: 'object',
          properties: { a: { type: 'string', title: 'a', enum: ['yes', 'no'] } },
          dependencies: {
            a: {
              oneOf: [
                { properties: { a: { enum: ['no'] } } },
                { properties: { a: { enum: ['yes'] }, b: { type: 'boolean', title: 'B', default: false } } },
              ],
            },
          },
        },
      },
      type: 'array',
      minItems: 1,
      maxItems: 2,
      items: { $ref: '#/definitions/guest' },
      default: [{ a: 'yes' }, { a: 'no' }],
    };
    const form = <Form schema={schema} validator={validator} />;
    // React 19 reports an attribute mismatch, the issue's `aria-controls` one, through console.error and not
    // onRecoverableError, and the server render reports its own warnings there too
    const consoleErrorSpy = vi.spyOn(console, 'error');
    try {
      const container = document.createElement('div');
      container.innerHTML = renderToString(form);
      expect(container.querySelector('input#root_0_b[type="checkbox"]')).not.toBeNull();
      expect(container.querySelector('#root_1_b')).toBeNull();
      document.body.append(container);
      const recoverableErrors: unknown[] = [];
      render(form, { container, hydrate: true, onRecoverableError: (error) => recoverableErrors.push(error) });

      expect(recoverableErrors).toEqual([]);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});

checkboxLabelTests(Form, { generateTemplates, generateWidgets, descriptionBy: 'self' });
fallbackDescriptionTests(Form, false);

optionErrorStateTests(Form, () =>
  screen.getByText('Help').closest('.MuiFormHelperText-root')?.classList.contains('Mui-error'),
);

wrapIfAdditionalErrorStateTests(Form);
wrapIfAdditionalFlagTests(Form);

wrapIfAdditionalCallbackTests(Form);

submitPendingTests(Form);
