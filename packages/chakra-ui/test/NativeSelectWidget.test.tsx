import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import Form from './WrappedForm.tsx';

describe('NativeSelectWidget', () => {
  test('select field with enum', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          enum: ['red', 'green', 'blue'],
        },
      },
    };
    const uiSchema: UiSchema = {
      color: {
        'ui:widget': 'NativeSelectWidget',
        'ui:placeholder': 'Pick something',
      },
    };
    const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
    expect(asFragment()).toMatchSnapshot();
  });
  test('select field multiple choice', async () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        type: 'string',
        enum: ['foo', 'bar', 'fuzz', 'qux'],
      },
      uniqueItems: true,
    };
    const uiSchema: UiSchema = {
      'ui:widget': 'NativeSelectWidget',
      'ui:placeholder': 'Pick something',
    };
    const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
    expect(asFragment()).toMatchSnapshot();
  });
  test('select field multiple choice with labels', async () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        type: 'number',
        anyOf: [
          {
            enum: [1],
            title: 'Blue',
          },
          {
            enum: [2],
            title: 'Red',
          },
          {
            enum: [3],
            title: 'Green',
          },
        ],
      },
      uniqueItems: true,
    };
    const uiSchema: UiSchema = {
      'ui:widget': 'NativeSelectWidget',
      'ui:placeholder': 'Pick something',
    };
    const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
    expect(asFragment()).toMatchSnapshot();
  });
  test('select field with optgroups', () => {
    const schema: RJSFSchema = {
      type: 'string',
      enum: ['foo', 'bar', 'baz', 'qux'],
    };
    const uiSchema: UiSchema = {
      'ui:widget': 'NativeSelectWidget',
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
          'Group B': ['baz'],
        },
      },
    };
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const optgroups = container.querySelectorAll('optgroup');
    expect(optgroups).toHaveLength(2);
    expect(optgroups[0]).toHaveAttribute('label', 'Group A');
    expect(optgroups[1]).toHaveAttribute('label', 'Group B');
    expect(optgroups[0].querySelectorAll('option')).toHaveLength(2);
    expect(optgroups[1].querySelectorAll('option')).toHaveLength(1);

    // The placeholder plus the ungrouped option (qux) render as direct children of the select, not inside an optgroup
    const select = screen.getByRole('combobox');
    const directOptions = Array.from(select.children).filter((child) => child.tagName === 'OPTION');
    expect(directOptions).toHaveLength(2);
    expect(directOptions[1]).toHaveTextContent('qux');
  });
  test('select field disables options listed in enumDisabled, grouped or not', () => {
    const schema: RJSFSchema = {
      type: 'string',
      enum: ['foo', 'bar', 'baz'],
    };
    const uiSchema: UiSchema = {
      'ui:widget': 'NativeSelectWidget',
      'ui:enumDisabled': ['bar', 'baz'],
      'ui:options': { optgroups: { 'Group A': ['foo', 'bar'] } },
    };
    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByRole('option', { name: 'foo' })).toBeEnabled();
    expect(screen.getByRole('option', { name: 'bar' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'baz' })).toBeDisabled();
  });

  test('does not collide a group label with an option index key', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema: RJSFSchema = {
      type: 'string',
      enum: ['foo', 'bar'],
    };
    const uiSchema: UiSchema = {
      'ui:widget': 'NativeSelectWidget',
      // '0' is also the index key of the first ungrouped option
      'ui:options': { optgroups: { '0': ['bar'] } },
    };
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(container.querySelectorAll('optgroup')).toHaveLength(1);
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything());
    consoleError.mockRestore();
  });
});
