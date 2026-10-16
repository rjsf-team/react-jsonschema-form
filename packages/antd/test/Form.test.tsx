import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { ErrorSchema, FormValidation, RJSFSchema, UiSchema } from '@rjsf/utils';
import { errorId, fieldLabelId, helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ConfigProvider, theme } from 'antd';

import Form, { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

const user = userEvent.setup();

/** Checks that every id a `for`, an `aria-labelledby` or an `aria-describedby` in `container` names belongs to an element
 * there
 */
function expectReferencesResolve(container: HTMLElement) {
  container.querySelectorAll('label[for]').forEach((label) => {
    expect(container.querySelector(`[id="${label.getAttribute('for')}"]`)).toBeInTheDocument();
  });
  container.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach((element) => {
    [element.getAttribute('aria-labelledby'), element.getAttribute('aria-describedby')]
      .join(' ')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((referencedId) => expect(container.querySelector(`[id="${referencedId}"]`)).toBeInTheDocument());
  });
}

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('antd specific tests', () => {
  test('applies the required attribute to required input fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          title: 'Name',
        },
      },
    };

    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector('input#root_name')).toHaveAttribute('required');
  });

  test('applies the required attribute to required number fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['age'],
      properties: {
        age: {
          type: 'number',
          title: 'Age',
        },
      },
    };

    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelector('input#root_age')).toHaveAttribute('required');
  });

  test('clearing an optional integer field removes the value instead of setting null', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        age: {
          type: 'integer',
          title: 'Age',
        },
      },
    };
    const onChange = vi.fn();

    const { container } = render(<Form schema={schema} validator={validator} onChange={onChange} />);
    const input = container.querySelector('input#root_age') as HTMLInputElement;

    await user.type(input, '1');
    await user.clear(input);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.formData).toEqual({});
  });

  test('renders both the help text and the errors when a field has ui:help', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Name',
        },
      },
    };
    const extraErrors = { name: { __errors: ['a field error'] } } as ErrorSchema;

    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ name: { 'ui:help': 'some help text' } }}
        validator={validator}
        extraErrors={extraErrors}
      />,
    );

    const explain = container.querySelector('.ant-form-item-explain')!;
    expect(explain.querySelector('#root_name__error')).toHaveTextContent('a field error');
    expect(explain.querySelector('#root_name__help')).toHaveTextContent('some help text');
    expect(explain.querySelector('#root_name__help')).toHaveStyle({
      color: theme.getDesignToken().colorTextDescription,
    });
  });

  test('renders a ui:help passed as a React element', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Name',
        },
      },
    };

    const { container } = render(
      <Form schema={schema} uiSchema={{ name: { 'ui:help': <strong>element help</strong> } }} validator={validator} />,
    );

    expect(container.querySelector('#root_name__help')).toHaveTextContent('element help');
  });

  test('renders a ui:help inherited from ui:globalOptions', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Name',
        },
      },
    };

    const { container } = render(
      <Form schema={schema} uiSchema={{ 'ui:globalOptions': { help: 'global help' } }} validator={validator} />,
    );

    expect(container.querySelector('#root_name__help')).toHaveTextContent('global help');
  });

  test('does not render an explain block when an explicit ui:help overrides a global one away', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    };

    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ 'ui:globalOptions': { help: 'global help' }, name: { 'ui:help': undefined } }}
        validator={validator}
      />,
    );

    const nameItem = container.querySelector('#root_name')!.closest('.ant-form-item')!;
    expect(nameItem.querySelector('.ant-form-item-explain')).toBeNull();
  });

  test('renders the help text with no error styling when ui:hideError suppresses the errors', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    };
    const uiSchema = { name: { 'ui:help': 'some help text', 'ui:hideError': true } };

    const { container } = render(
      <Form
        schema={schema}
        uiSchema={uiSchema}
        validator={validator}
        extraErrors={{ name: { __errors: ['a field error'] } }}
      />,
    );

    const explain = container.querySelector('.ant-form-item-explain')!;
    expect(explain).toHaveTextContent('some help text');
    expect(explain).not.toHaveTextContent('a field error');
    expect(explain.querySelector('.ant-form-item-explain-error')).toBeNull();
  });

  test('styles help as help in the error-tinted block a oneOf field renders its errors and help in', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: {
          oneOf: [
            { type: 'string', title: 'A string' },
            { type: 'number', title: 'A number' },
          ],
        },
      },
    };

    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ name: { 'ui:help': 'some help text' } }}
        validator={validator}
        extraErrors={{ name: { __errors: ['a field error'] } }}
      />,
    );

    // The field above the option it selected draws its help and its errors once, in the one block
    expect(container.querySelectorAll('#root_name__help')).toHaveLength(1);
    const explain = container.querySelector('#root_name__help')!.closest('.ant-form-item-explain');
    expect(explain?.querySelector('#root_name__error')).not.toBeNull();
    expect(explain?.querySelector('.ant-form-item-explain-error')).not.toBeNull();
    expect(explain?.querySelector('.help-block')).toHaveStyle({
      color: theme.getDesignToken().colorTextDescription,
    });
  });

  test("renders an array's description once when its anyOf option renders the title and description", () => {
    const opt: RJSFSchema = {
      type: 'array',
      title: 'Tags',
      description: 'Up to three',
      items: { type: 'string' },
      anyOf: [{ minItems: 1 }, { maxItems: 3 }],
    };
    const { container } = render(
      <Form schema={{ type: 'object', properties: { opt } }} validator={validator} formData={{ opt: ['x'] }} />,
    );

    expect(screen.getAllByText('Up to three')).toHaveLength(1);
    expect(container.querySelectorAll('#root_opt__description')).toHaveLength(1);
  });

  test('descriptionLocation tooltip in formContext', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        'my-field': {
          type: 'string',
          description: 'some description',
        },
      },
    };
    const formContext = { descriptionLocation: 'tooltip' };
    const { asFragment } = render(<Form schema={schema} validator={validator} formContext={formContext} />);
    expect(asFragment()).toMatchSnapshot();
  });

  // antd renders a tooltip only beside a label, and its popup only while open
  test.each([
    ['a field whose template draws its label, from its closed tooltip', { type: 'string', title: 'Name' }],
    ['a checkbox, which draws its own label, from below it', { type: 'boolean', title: 'Name' }],
  ] as const)('descriptionLocation tooltip describes %s', (_, field) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { name: { ...field, description: 'Your name' } } }}
        validator={validator}
        formContext={{ descriptionLocation: 'tooltip' }}
      />,
    );

    expect(container.querySelector('#root_name')).toHaveAccessibleDescription('Your name');
  });

  test("descriptionLocation tooltip describes a field from its closed tooltip under antd's shared tooltip", () => {
    const { container } = render(
      <ConfigProvider tooltip={{ unique: true }}>
        <Form
          schema={{ type: 'object', properties: { name: { type: 'string', title: 'Name', description: 'Your name' } } }}
          validator={validator}
          formContext={{ descriptionLocation: 'tooltip' }}
        />
      </ConfigProvider>,
    );

    expect(container.querySelector('#root_name')).toHaveAccessibleDescription('Your name');
  });

  test("names a radio group by its label's text, without the icon of the tooltip it describes it by", () => {
    render(
      <Form
        schema={{
          type: 'object',
          properties: { color: { type: 'string', title: 'Color', description: 'Pick one', enum: ['red', 'blue'] } },
        }}
        uiSchema={{ color: { 'ui:widget': 'radio' } }}
        formContext={{ descriptionLocation: 'tooltip' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Color');
  });

  test('alt-datetime renders the time selects and its Now button emits a date-time', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Form
        schema={{ type: 'string', format: 'date-time' }}
        uiSchema={{ 'ui:widget': 'alt-datetime' }}
        validator={validator}
        onChange={onChange}
      />,
    );

    expect(container.querySelector('#root_hour')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Now' }));
    expect(onChange.mock.lastCall?.[0].formData).toMatch(/T\d{2}:\d{2}:\d{2}/);
  });

  test.each([
    ['ui:readonly', 'Now'],
    ['ui:readonly', 'Clear'],
    ['ui:disabled', 'Now'],
    ['ui:disabled', 'Clear'],
  ])('a %s alt-date disables and ignores its %s button', async (flag, button) => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{ 'ui:widget': 'alt-date', [flag]: true }}
        formData='2020-01-02'
        validator={validator}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: button })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: button }));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('describes a selected option once, under the id its control is described by', () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { region: { oneOf: [{ title: 'None', type: 'null' }, { $ref: '#/$defs/europe' }] } },
          $defs: {
            europe: {
              title: 'Europe',
              description: 'A country in Europe',
              oneOf: [
                { const: 'FR', title: 'France' },
                { const: 'DE', title: 'Germany' },
              ],
            },
          },
        }}
        formData={{ region: 'DE' }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('A country in Europe')).toHaveLength(1);
    expect(container.querySelector('#root_region__description')).toHaveTextContent('A country in Europe');
  });

  test("renders an option's inherited ui:description once, as the field's", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            region: {
              oneOf: [
                { title: 'None', type: 'null' },
                { title: 'Text', type: 'string' },
              ],
            },
          },
        }}
        uiSchema={{ region: { 'ui:description': 'Where you live' } }}
        formData={{ region: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('Where you live')).toHaveLength(1);
    expect(container.querySelectorAll('#root_region__description')).toHaveLength(1);
  });

  test('renders no second description under the field description id for a fallback value described apart', () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            x: {
              title: 'X',
              description: 'Field desc',
              type: ['string', 'number'],
              if: { type: 'string' },
              then: { description: 'Value desc' },
            },
          },
        }}
        formData={{ x: 'a' }}
        validator={validator}
        useFallbackUiForUnsupportedType
      />,
    );

    expect(container.querySelectorAll('#root_x__description')).toHaveLength(1);
    expect(container.querySelector('#root_x__description')).toHaveTextContent('Field desc');
  });

  test("names an anyOf option selector by its field's label, which keeps antd's colon handling", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            foo: {
              title: 'Foo:',
              anyOf: [
                { title: 'Text', type: 'string' },
                { title: 'Number', type: 'number' },
              ],
            },
          },
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_foo__anyof_select')).toHaveAccessibleName('Foo');
    expect(container.querySelector('label[for="root_foo"]')).toHaveAttribute('title', 'Foo:');
  });

  test("names an object's option selector by the object's heading", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          title: 'Pet',
          properties: { name: { type: 'string' } },
          anyOf: [
            { title: 'Dog', properties: { bark: { type: 'string' } } },
            { title: 'Cat', properties: { meow: { type: 'string' } } },
          ],
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('input#root__anyof_select')).toHaveAccessibleName('Pet');
  });

  test("keeps an optional object's data control where ui:label turns its heading off", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { pet: { type: 'object', title: 'Pet', properties: { a: { type: 'string' } } } },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] }, pet: { 'ui:label': false } }}
        formData={{ pet: { a: 'x' } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_pet__title')).not.toBeInTheDocument();
    expect(container.querySelector('#root_pet__optionalRemove')).toBeInTheDocument();
  });

  test("draws no heading for an array option whose ui:title repeats its field's label", () => {
    const { container } = render(
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

    expect(container.querySelector(`#${fieldLabelId('root_tags')}`)).toHaveTextContent('Tags');
    expect(container.querySelector('#root_tags__title')).not.toBeInTheDocument();
  });

  test("keeps an optional array option's data control where a field above draws its heading", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            tags: {
              title: 'Tags',
              anyOf: [
                { type: 'array', items: { type: 'string' } },
                { type: 'array', items: { type: 'number' } },
              ],
            },
          },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['array'] } }}
        formData={{ tags: ['a'] }}
        validator={validator}
      />,
    );

    expect(container.querySelector(`#${fieldLabelId('root_tags')}`)).toHaveTextContent('Tags');
    expect(container.querySelector('#root_tags__title')).not.toBeInTheDocument();
    expect(container.querySelector('#root_tags__optionalRemove')).toBeInTheDocument();
  });

  // antd draws the `*` as the required label's generated content, which jsdom leaves out of a name but a browser doesn't
  test("names a required object's option selector by its heading's text, outside the label antd marks required", () => {
    const pet: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      properties: { name: { type: 'string' } },
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };
    const { container } = render(
      <Form schema={{ type: 'object', properties: { pet }, required: ['pet'] }} validator={validator} />,
    );

    const heading = container.querySelector('#root_pet_XxxOf__title');
    expect(heading).toHaveTextContent(/^Pet$/);
    expect(heading).not.toHaveClass('ant-form-item-required');
    expect(heading?.closest('label')).toHaveClass('ant-form-item-required');
    expect(container.querySelector('input#root_pet__anyof_select')).toHaveAccessibleName('Pet');
  });
  test('draws the label of a checkbox whose presentation gives it to the template once, from the template', () => {
    render(
      <Form
        schema={{ type: 'boolean', title: 'Bee' }}
        uiSchema={{ 'ui:widget': 'checkbox' }}
        presentation={{ widgets: { CheckboxWidget: { label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('Bee')).toHaveLength(1);
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Bee');
  });
  test.each([
    ['declares it holds false unchecked', { uncheckedIsFalse: true }, false],
    ['declares nothing', {}, true],
  ])("marks the template's label for a switch that %s only where its plan says", (_, declaration, marked) => {
    const SwitchWidget = () => null;
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'boolean', title: 'Foo' } }, required: ['foo'] }}
        uiSchema={{ foo: { 'ui:widget': 'SwitchWidget' } }}
        widgets={{ SwitchWidget }}
        presentation={{ widgets: { SwitchWidget: { ...declaration, label: 'template' } } }}
        validator={validator}
      />,
    );

    const label = container.querySelector('label[for="root_foo"]');
    expect(label).toHaveTextContent('Foo');
    expect(label?.classList.contains('ant-form-item-required')).toBe(marked);
  });
});

describe("antd's error and help elements carry the ids their field's plan describes its control by", () => {
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

  test("renders an option's own help as a block under its own id, beside the field's", () => {
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ pet: { 'ui:help': 'Pick a pet', anyOf: [{ 'ui:help': 'Dogs bark' }, {}] } }}
        validator={validator}
      />,
    );

    expect(container.querySelectorAll(`#${helpId('root_pet')}`)).toHaveLength(1);
    expect(container.querySelector(`#${helpId('root_pet')}`)).toHaveTextContent('Pick a pet');
    expect(container.querySelector(`div#${optionHelpId('root_pet')}`)).toHaveTextContent('Dogs bark');
    expect(container.querySelector('#root_pet')).toHaveAccessibleDescription('Pick a pet Dogs bark');
  });

  test("renders an anyOf field's errors once, under the id its control is described by", () => {
    const { container } = render(
      <Form schema={schema} extraErrors={{ pet: { __errors: ['pick one'] } }} validator={validator} />,
    );

    expect(container.querySelectorAll(`#${errorId('root_pet')}`)).toHaveLength(1);
    expect(container.querySelector('#root_pet')).toHaveAccessibleDescription('pick one');
  });
});

describe('antd focusOnFirstError', () => {
  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['text input', { type: 'string' }, {}, '#root_x'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, '#root_x'],
    ['checkbox', { type: 'boolean' }, {}, '#root_x'],
    ['number input', { type: 'number' }, { 'ui:widget': 'updown' }, '#root_x'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, '#root_x'],
    ['date picker', { type: 'string', format: 'date' }, {}, '#root_x'],
    // A group's wrapper carries the field's id but isn't focusable, so its first control is focused
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, '#root_x-0'],
    [
      'checkboxes group',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      '#root_x-0',
    ],
    // The date parts' group carries the field's id but isn't focusable, so its first part is focused
    ['alt-date group', { type: 'string' }, { 'ui:widget': 'alt-date' }, '#root_x_year'],
    ['alt-datetime group', { type: 'string' }, { 'ui:widget': 'alt-datetime' }, '#root_x_year'],
    // The slider's root carries the field's id but isn't focusable, so the handle inside it is focused
    ['slider', { type: 'number' }, { 'ui:widget': 'range' }, '#root_x [role="slider"]'],
  ])('moves focus to a %s with errors', async (_, x, ui, focused) => {
    const { container } = render(
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

    expect(container.querySelector(focused)).toHaveFocus();
  });
});

describe("antd widgets carry their field's plan on the element a user focuses", () => {
  test.each([
    ['text', { type: 'string' }, {}],
    ['number', { type: 'number' }, {}],
    ['password', { type: 'string' }, { 'ui:widget': 'password' }],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['date', { type: 'string', format: 'date' }, {}],
    ['checkbox', { type: 'boolean' }, {}],
  ] as const)('a %s control is invalid and described only by elements that render', (_, schema, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: uiSchema }}
        extraErrors={{ pet: { __errors: ['too short'] } }}
        validator={validator}
      />,
    );

    const control = container.querySelector('#root_pet');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAttribute('aria-describedby', 'root_pet__error');
    expect(control).toHaveAccessibleDescription('too short');
    expectReferencesResolve(container);
  });

  const colors: RJSFSchema = { type: 'string', title: 'Color', enum: ['red', 'blue'] };
  // ARIA supports `aria-invalid` on a `radiogroup` but not on a `group`, so a radio group carries it in place of its
  // radios while each checkbox carries its own. The label names the group with no `for`, which would name its wrapper
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
    "names a %s group by its label, marks the group or each option invalid, and describes each option by the field's errors",
    (widget, color, role, item, groupInvalid, optionInvalid) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { color } }}
          uiSchema={{ color: { 'ui:widget': widget } }}
          extraErrors={{ color: { __errors: ['pick one'] } }}
          validator={validator}
        />,
      );

      const group = container.querySelector('#root_color');
      expect(group).toHaveRole(role);
      expect(group).toHaveAccessibleName('Color');
      expect(group?.getAttribute('aria-invalid')).toBe(groupInvalid);
      expect(container.querySelector('#root_color__label label')).not.toHaveAttribute('for');
      for (const option of screen.getAllByRole(item)) {
        expect(option.getAttribute('aria-invalid')).toBe(optionInvalid);
        expect(option).toHaveAccessibleDescription('pick one');
      }
      expectReferencesResolve(container);
    },
  );

  test("names a required range's slider by its label, which a for can't reach", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          required: ['volume'],
          properties: { volume: { type: 'integer', title: 'Volume', minimum: 0, maximum: 10 } },
        }}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAccessibleName('Volume');
    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-required');
    expect(container.querySelector('#root_volume__label label')).not.toHaveAttribute('for');
  });

  test("names a range's slider by the text of the label ui:label: false hides", () => {
    render(
      <Form
        schema={{
          type: 'object',
          properties: { volume: { type: 'integer', title: 'Volume', minimum: 0, maximum: 10 } },
        }}
        uiSchema={{ volume: { 'ui:widget': 'range', 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAccessibleName('Volume');
  });
});

describe('antd focuses and names its groups as core does', () => {
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

  test.each(['alt-date', 'alt-datetime'])(
    "names the %s parts' group by the template's label, which draws no for",
    (widget) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
          uiSchema={{ when: { 'ui:widget': widget } }}
          validator={validator}
        />,
      );

      expect(screen.getByRole('group', { name: 'When' })).toHaveAttribute('id', 'root_when');
      expect(container.querySelector('label[for="root_when"]')).toBeNull();
    },
  );
});

describe('antd read-only fields under readonlyAsDisabled: false', () => {
  test.each<[string, RJSFSchema, UiSchema]>([
    ['text input', { type: 'string' }, {}],
    ['number input', { type: 'number' }, {}],
    ['password input', { type: 'string' }, { 'ui:widget': 'password' }],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['date picker', { type: 'string', format: 'date' }, {}],
  ])("keep a required %s read-only, so leaving it empty doesn't block the submit", (_, x, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', required: ['x'], properties: { x: { ...x, title: 'X' } } }}
        uiSchema={{ x: { ...uiSchema, 'ui:readonly': true } }}
        formContext={{ readonlyAsDisabled: false }}
        validator={validator}
      />,
    );
    const control = container.querySelector('#root_x')!;

    expect(control).toHaveAttribute('readonly');
    expect(control).not.toBeDisabled();
    expect(container.querySelector('form')!.checkValidity()).toBe(true);
  });

  test("open no date picker's popup", async () => {
    render(
      <Form
        schema={{ type: 'object', properties: { x: { type: 'string', format: 'date', title: 'X' } } }}
        uiSchema={{ x: { 'ui:readonly': true } }}
        formContext={{ readonlyAsDisabled: false }}
        validator={validator}
      />,
    );

    await user.click(screen.getByRole('textbox', { name: 'X' }));

    expect(document.querySelector('.ant-picker-dropdown')).not.toBeInTheDocument();
  });

  test("keep an additionalProperties entry's key input read-only", async () => {
    render(
      <Form
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        uiSchema={{ 'ui:readonly': true }}
        formData={{ first: 'a' }}
        formContext={{ readonlyAsDisabled: false }}
        validator={validator}
      />,
    );
    const keyInput = screen.getByRole('textbox', { name: 'first Key' });

    await user.type(keyInput, 'x');

    expect(keyInput).toHaveAttribute('readonly');
    expect(keyInput).not.toBeDisabled();
    expect(keyInput).toHaveValue('first');
  });
});
