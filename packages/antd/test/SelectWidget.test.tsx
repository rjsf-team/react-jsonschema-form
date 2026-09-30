import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

describe('SelectWidget optgroups', () => {
  const schema: RJSFSchema = {
    type: 'string',
    enum: ['foo', 'bar', 'baz', 'qux'],
  };

  it('renders a labeled group for each optgroups entry, plus the ungrouped options', async () => {
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
    expect(screen.getByTitle('foo')).toBeInTheDocument();
    expect(screen.getByTitle('bar')).toBeInTheDocument();
    expect(screen.getByTitle('baz')).toBeInTheDocument();
    expect(screen.getByTitle('qux')).toBeInTheDocument();
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

    expect(screen.getByTitle('foo')).not.toHaveClass('ant-select-item-option-disabled');
    expect(screen.getByTitle('bar')).toHaveClass('ant-select-item-option-disabled');
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
    await user.click(screen.getByTitle('baz'));

    expect(onChange.mock.calls[0][0]).toEqual(expect.objectContaining({ formData: 'baz' }));
  });

  it('searches the options of a group rather than its label', async () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          // A label chosen to contain the search text below, which none of its options do
          Bazaar: ['foo', 'bar'],
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    await user.type(combobox, 'zaa');

    expect(screen.queryByTitle('foo')).not.toBeInTheDocument();
    expect(screen.queryByTitle('bar')).not.toBeInTheDocument();

    await user.clear(combobox);
    await user.type(combobox, 'ba');

    expect(screen.getByTitle('bar')).toBeInTheDocument();
    expect(screen.getByTitle('baz')).toBeInTheDocument();
    expect(screen.queryByTitle('foo')).not.toBeInTheDocument();
  });
});

describe('SelectWidget focus and blur', () => {
  it.each(['indexed', 'realValue'] as const)(
    'reports the form data value on focus and blur in the %s format',
    async (optionValueFormat) => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <>
          <Form
            schema={{ type: 'number', enum: [10, 20] }}
            uiSchema={{ 'ui:options': { optionValueFormat } }}
            formData={10}
            validator={validator}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <button type='button'>After select</button>
        </>,
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('button', { name: 'After select' }));

      expect(onFocus).toHaveBeenCalledWith('root', 10);
      expect(onBlur).toHaveBeenCalledWith('root', 10);
    },
  );
});

describe('SelectWidget over object constants', () => {
  it('shows the validation feedback of a typed object select, as for any other select', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        plan: {
          type: 'object',
          oneOf: [
            { const: { tier: 1 }, title: 'Basic' },
            { const: { tier: 2 }, title: 'Pro' },
          ],
        },
        name: { type: 'string', enum: ['a', 'b'] },
      },
    };

    const { container } = render(<Form schema={schema} validator={validator} />);

    expect(container.querySelectorAll('.ant-select-has-feedback')).toHaveLength(2);
  });
});
