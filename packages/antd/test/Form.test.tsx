import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { ErrorSchema, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { theme } from 'antd';

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
    expect(container.querySelector('#root_name__help')).not.toHaveAttribute('style');
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
});
