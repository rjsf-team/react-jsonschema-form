import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

describe('SelectWidget optgroups', () => {
  const schema: RJSFSchema = {
    type: 'string',
    enum: ['foo', 'bar', 'baz', 'qux'],
  };

  it('renders a labeled group for each optgroups entry, plus the ungrouped options', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByTitle('foo')).toBeInTheDocument();
    expect(screen.getByTitle('bar')).toBeInTheDocument();
    expect(screen.getByTitle('baz')).toBeInTheDocument();
    expect(screen.getByTitle('qux')).toBeInTheDocument();
  });

  it('disables enumDisabled options inside an optgroup', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        enumDisabled: ['bar'],
        optgroups: {
          'Group A': ['foo', 'bar'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(screen.getByTitle('foo')).not.toHaveClass('ant-select-item-option-disabled');
    expect(screen.getByTitle('bar')).toHaveClass('ant-select-item-option-disabled');
  });

  it('selecting a grouped option fires onChange with the correct value', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
          'Group B': ['baz', 'qux'],
        },
      },
    };
    const onChange = vi.fn();

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} onChange={onChange} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByTitle('baz'));

    expect(onChange.mock.calls[0][0]).toEqual(expect.objectContaining({ formData: 'baz' }));
  });
});
