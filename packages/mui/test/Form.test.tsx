import { withTheme } from '@rjsf/core';
import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { FieldProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form, { Theme, generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

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
        formData={data}
        onChange={({ formData }) => expectTypeOf(formData).toEqualTypeOf<Data>()}
      />,
    );
    expect(container.querySelector<HTMLInputElement>('#root_name')?.value).toBe('a');
  });

  it('the default Theme serves a typed withTheme() form', () => {
    const TypedForm = withTheme<Data>(Theme);
    const { container } = render(<TypedForm schema={schema} validator={validator} formData={{ name: 'b' }} />);
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

    expect(container.querySelector('#root__anyof_select-label')).toHaveTextContent('Pet');
    expect(container.querySelector('#root_XxxOf__title')).not.toBeInTheDocument();
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
    expect(container.querySelector('#root__anyof_select-label')).not.toBeInTheDocument();
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
    expect(container.querySelector('#root_foo__anyof_select-label')).not.toBeInTheDocument();
  });
});

describe('the fallback UI', () => {
  it('names the value control with the field title, and describes it once', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { title: 'X', description: 'An x', type: ['string', 'number'] } } }}
        formData={{ x: 'a' }}
        validator={validator}
        useFallbackUiForUnsupportedType
      />,
    );

    expect(screen.getByLabelText('X')).toBe(container.querySelector('input#root_x'));
    expect(screen.getAllByText('An x')).toHaveLength(1);
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
