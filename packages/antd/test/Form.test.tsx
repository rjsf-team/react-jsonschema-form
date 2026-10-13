import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { ErrorSchema, RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ConfigProvider, theme } from 'antd';

import Form, { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

const user = userEvent.setup();

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

  test('styles help as help in the error-tinted block a oneOf field renders without its errors', () => {
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

    // `SchemaField` leaves `errors` undefined for the option selector while still reporting `rawErrors`, so this block
    // is in the error state with nothing but help to render. The block is found rather than indexed because the option
    // selector and the option it selected both render this field's help, under the same id — a pre-existing duplication
    // in `MultiSchemaField`, unrelated to the help/error precedence under test here
    const explains = Array.from(container.querySelectorAll('.ant-form-item-explain'));
    const helpOnly = explains.find((explain) => !explain.querySelector('[id$="__error"]'));
    expect(helpOnly).toBeDefined();
    expect(helpOnly!.querySelector('.ant-form-item-explain-error')).not.toBeNull();
    expect(helpOnly!.querySelector('.help-block')).toHaveStyle({
      color: theme.getDesignToken().colorTextDescription,
    });
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
  ])('a %s alt-date ignores its %s button', async (flag, button) => {
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

    await user.click(screen.getByRole('button', { name: button }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('antd DisabledContext', () => {
  const cases: { name: string; schema: RJSFSchema; uiSchema?: UiSchema; formData?: unknown; selector: string }[] = [
    { name: 'text input', schema: { type: 'string' }, selector: 'input#root' },
    { name: 'number input', schema: { type: 'number' }, selector: 'input#root' },
    { name: 'select', schema: { type: 'string', enum: ['one', 'two'] }, selector: 'input#root' },
    { name: 'checkbox', schema: { type: 'boolean' }, selector: 'input#root' },
    { name: 'textarea', schema: { type: 'string' }, uiSchema: { 'ui:widget': 'textarea' }, selector: 'textarea#root' },
    { name: 'date', schema: { type: 'string', format: 'date' }, selector: 'input#root' },
    {
      name: 'alt-date',
      schema: { type: 'string', format: 'date' },
      uiSchema: { 'ui:widget': 'alt-date' },
      selector: 'input#root_year',
    },
    { name: 'date-time', schema: { type: 'string', format: 'date-time' }, selector: 'input#root' },
    { name: 'password', schema: { type: 'string' }, uiSchema: { 'ui:widget': 'password' }, selector: 'input#root' },
    { name: 'range', schema: { type: 'number' }, uiSchema: { 'ui:widget': 'range' }, selector: '.ant-slider' },
    {
      name: 'additional property key input',
      schema: { type: 'object', additionalProperties: { type: 'string' } },
      formData: { extra: 'value' },
      selector: 'input#root_extra-key',
    },
    {
      name: 'additional property key select',
      schema: { type: 'object', additionalProperties: { type: 'string' }, propertyNames: { enum: ['extra', 'other'] } },
      formData: { extra: 'value' },
      selector: 'input#root_extra-key',
    },
  ];

  describe.each(cases)('$name', ({ schema, uiSchema, formData, selector }) => {
    test.each([
      { name: 'inherits disabled context', contextDisabled: true, disabled: false, readonly: false, expected: true },
      {
        name: 'stays enabled without disabled context',
        contextDisabled: false,
        disabled: false,
        readonly: false,
        expected: false,
      },
      { name: 'keeps explicit disabled', contextDisabled: false, disabled: true, readonly: false, expected: true },
      { name: 'keeps readonly disabled', contextDisabled: false, disabled: false, readonly: true, expected: true },
    ])('$name', ({ contextDisabled, disabled, readonly, expected }) => {
      const { container } = render(
        <ConfigProvider componentDisabled={contextDisabled}>
          <Form
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            disabled={disabled}
            readonly={readonly}
            validator={validator}
          />
        </ConfigProvider>,
      );
      const control = container.querySelector(selector);
      expect(control).toBeInTheDocument();
      if (selector === '.ant-slider') {
        expect(control?.classList.contains('ant-slider-disabled')).toBe(expected);
      } else if (expected) {
        expect(control).toBeDisabled();
      } else {
        expect(control).not.toBeDisabled();
      }
    });
  });

  test('a context-disabled field does not call onChange when used', async () => {
    const onChange = vi.fn();
    render(
      <ConfigProvider componentDisabled>
        <Form schema={{ type: 'string' }} formData='x' validator={validator} onChange={onChange} />
      </ConfigProvider>,
    );
    await user.type(screen.getByRole('textbox'), 'y');
    expect(onChange).not.toHaveBeenCalled();
  });

  test.each([
    {
      name: 'array item buttons',
      schema: { type: 'array', items: { type: 'string' } } as RJSFSchema,
      uiSchema: { 'ui:options': { copyable: true } } as UiSchema,
      formData: ['one', 'two'],
      buttons: ['Add Item', 'Copy', 'Remove', 'Move up', 'Move down'],
    },
    {
      name: 'additional property buttons',
      schema: { type: 'object', additionalProperties: { type: 'string' } } as RJSFSchema,
      uiSchema: undefined,
      formData: { extra: 'value' },
      buttons: ['Add Item', 'Remove'],
    },
  ])('$name stay disabled under the context and change no data', async ({ schema, uiSchema, formData, buttons }) => {
    const onChange = vi.fn();
    const { container } = render(
      <ConfigProvider componentDisabled>
        <Form schema={schema} uiSchema={uiSchema} formData={formData} validator={validator} onChange={onChange} />
      </ConfigProvider>,
    );
    const found: Element[] = [];
    for (const name of buttons) {
      const named = Array.from(container.querySelectorAll(`button[title="${name}"]`));
      expect(named.length).toBeGreaterThan(0);
      found.push(...named);
    }
    for (const button of found) {
      expect(button).toBeDisabled();
    }
    await Promise.all(found.map((button) => user.click(button as HTMLElement)));
    expect(onChange).not.toHaveBeenCalled();
  });
});
