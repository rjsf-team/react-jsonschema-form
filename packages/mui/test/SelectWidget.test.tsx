import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import '@testing-library/jest-dom';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import Form from '../src/index.ts';

describe('SelectWidget optgroups', () => {
  const schema: RJSFSchema = {
    type: 'string',
    enum: ['foo', 'bar', 'baz', 'qux'],
  };

  it('renders a ListSubheader for each optgroups entry, followed by that group’s options', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
          'Group B': ['baz', 'qux'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'foo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'bar' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'baz' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'qux' })).toBeInTheDocument();
  });

  it('hides group headings from assistive tech instead of exposing them as selectable options', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
          'Group B': ['baz', 'qux'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(screen.getByText('Group A')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Group B')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('option', { name: 'Group A' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Group B' })).not.toBeInTheDocument();
  });

  it('renders ungrouped options after the optgroups', () => {
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
    expect(screen.getByRole('option', { name: 'baz' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'qux' })).toBeInTheDocument();
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

    expect(screen.getByRole('option', { name: 'foo' })).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'bar' })).toHaveAttribute('aria-disabled', 'true');
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
    fireEvent.click(screen.getByRole('option', { name: 'baz' }));

    expect(onChange.mock.calls[0][0]).toEqual(expect.objectContaining({ formData: 'baz' }));
  });
});
