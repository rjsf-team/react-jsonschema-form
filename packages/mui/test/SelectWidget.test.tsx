import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import '@testing-library/jest-dom';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import Form from '../src/index.ts';

const user = userEvent.setup();

describe('SelectWidget optgroups', () => {
  const schema: RJSFSchema = {
    type: 'string',
    enum: ['foo', 'bar', 'baz', 'qux'],
  };

  it('renders a ListSubheader for each optgroups entry, followed by that group’s options', async () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
          'Group B': ['baz', 'qux'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'foo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'bar' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'baz' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'qux' })).toBeInTheDocument();
  });

  it('announces group headings, marked as not selectable', async () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
          'Group B': ['baz', 'qux'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    await user.click(screen.getByRole('combobox'));

    // MUI clones every child of `Select` with `role='option'`, so the headings can't be exposed as groups; they are
    // marked `aria-disabled` instead, so they're announced but not offered as choices
    expect(screen.getByText('Group A')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Group B')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'Group A' })).toBeInTheDocument();
  });

  it('does not change the form data when a group heading is clicked', async () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
        },
      },
    };
    const onChange = vi.fn();

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Group A'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders ungrouped options after the optgroups', async () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'baz' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'qux' })).toBeInTheDocument();
  });

  it('disables enumDisabled options inside an optgroup', async () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        enumDisabled: ['bar'],
        optgroups: {
          'Group A': ['foo', 'bar'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: 'foo' })).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'bar' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('selecting a grouped option fires onChange with the correct value', async () => {
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

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'baz' }));

    expect(onChange.mock.calls[0][0]).toEqual(expect.objectContaining({ formData: 'baz' }));
  });
});
