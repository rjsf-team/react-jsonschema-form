import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form, { generateForm, generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

describe('daisyui entry points', () => {
  test('generateForm() renders a working Form', () => {
    const GeneratedForm = generateForm();
    const schema: RJSFSchema = { type: 'string' };
    const { container } = render(<GeneratedForm schema={schema} validator={validator} />);
    expect(container.querySelector('input')).not.toBeNull();
  });

  test('generateTemplates() registers the DaisyUI array title/description templates', () => {
    const templates = generateTemplates();
    expect(templates.ArrayFieldTitleTemplate).toBeDefined();
    expect(templates.ArrayFieldDescriptionTemplate).toBeDefined();
  });

  test('generateTheme() wires the generated templates and widgets together', () => {
    const theme = generateTheme();
    expect(theme.templates?.ArrayFieldTitleTemplate).toBeDefined();
    expect(theme.widgets).toBeDefined();
  });

  test('generateWidgets() returns a fresh widget map', () => {
    const widgets = generateWidgets();
    expect(widgets.SelectWidget).toBeDefined();
    expect(widgets.toggle).toBeDefined();
  });
});

describe('DaisyUI array field title/description', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      tags: {
        type: 'array',
        title: 'Tags',
        description: 'A list of tags',
        items: { type: 'string' },
      },
    },
  };

  test('renders the array title with DaisyUI styling instead of the core default', () => {
    const { container } = render(<Form schema={schema} validator={validator} />);
    const title = container.querySelector('h3');
    expect(title).not.toBeNull();
    expect(title).toHaveTextContent('Tags');
    expect(title).toHaveClass('text-2xl', 'font-bold');
  });

  test('gives the array title the same id core would derive from the fieldPathId', () => {
    const { container } = render(<Form schema={schema} validator={validator} />);
    expect(container.querySelector('#root_tags__title')).not.toBeNull();
  });

  test('renders the array description with DaisyUI styling instead of the core default', () => {
    const { container } = render(<Form schema={schema} validator={validator} />);
    const description = container.querySelector('.text-sm.text-accent');
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent('A list of tags');
  });

  test('gives the array description the same id core would derive from the fieldPathId', () => {
    const { container } = render(<Form schema={schema} validator={validator} />);
    expect(container.querySelector('#root_tags__description')).not.toBeNull();
  });

  test('omits the array title and description when ui:options.label is false', () => {
    const uiSchema: UiSchema = { tags: { 'ui:options': { label: false } } };
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
    expect(container.querySelector('h3')).toBeNull();
    expect(container.querySelector('.text-sm.text-accent')).toBeNull();
  });
});

describe('ui:options.daisy', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
    },
  };

  test('applies theme, className and style to the field wrapper', () => {
    const uiSchema: UiSchema = {
      name: {
        'ui:options': {
          daisy: {
            theme: 'dark',
            className: 'custom-field',
            style: { color: 'rgb(1, 2, 3)' },
          },
        },
      },
    };
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
    const field = container.querySelector('#root_name')?.closest('.field-template');

    expect(field).toHaveAttribute('data-theme', 'dark');
    expect(field).toHaveClass('custom-field');
    expect(field).toHaveStyle({ color: 'rgb(1, 2, 3)' });
  });

  test('leaves the field wrapper unaffected when not set', () => {
    const { container } = render(<Form schema={schema} validator={validator} />);
    const field = container.querySelector('#root_name')?.closest('.field-template');

    expect(field).not.toHaveAttribute('data-theme');
  });
});
