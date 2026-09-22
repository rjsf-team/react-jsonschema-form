import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import Form from './WrappedForm.tsx';

// Ark UI's Select content is always mounted (just visually hidden until opened), so these
// tests can check the rendered structure without driving the popover's real open interaction
// (zag-js schedules a positioning update via requestAnimationFrame that relies on DOM APIs
// jsdom doesn't implement, so simulated clicks on the trigger/items aren't reliable here).
describe('SelectWidget optgroups', () => {
  const schema: RJSFSchema = {
    type: 'string',
    enum: ['foo', 'bar', 'baz', 'qux'],
  };

  test('renders a labeled group for each optgroups entry, plus the ungrouped options in order', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group A': ['foo', 'bar'],
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByText('Group A')).toBeInTheDocument();
    const options = container.querySelectorAll('[role="option"]');
    expect(Array.from(options).map((option) => option.textContent)).toEqual(['foo', 'bar', 'baz', 'qux']);
  });

  test('groups options in ui:options.optgroups order, independent of enum order', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optgroups: {
          'Group B': ['baz', 'qux'],
          'Group A': ['foo', 'bar'],
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const options = container.querySelectorAll('[role="option"]');
    expect(Array.from(options).map((option) => option.textContent)).toEqual(['baz', 'qux', 'foo', 'bar']);
  });

  test('does not collide a group label with an option value key', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const uiSchema: UiSchema = {
      // '0' is also the value key of the first ungrouped option under the default 'indexed' format
      'ui:options': { optgroups: { '0': ['bar'] } },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(container.querySelectorAll('[role="option"]')).toHaveLength(4);
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything());
    consoleError.mockRestore();
  });

  test('skips options that encode to an empty value when optionValueFormat is realValue', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optionValueFormat: 'realValue',
      },
    };

    const { container } = render(
      <Form schema={{ type: 'string', enum: ['foo', '', 'bar'] }} uiSchema={uiSchema} validator={validator} />,
    );

    const options = container.querySelectorAll('[role="option"]');
    expect(Array.from(options).map((option) => option.textContent)).toEqual(['foo', 'bar']);
  });

  test('omits a group whose options all encode to an empty value when optionValueFormat is realValue', () => {
    const uiSchema: UiSchema = {
      'ui:options': {
        optionValueFormat: 'realValue',
        optgroups: {
          'Group A': ['foo'],
          'Empty Group': [''],
        },
      },
    };

    render(<Form schema={{ type: 'string', enum: ['foo', '', 'bar'] }} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.queryByText('Empty Group')).not.toBeInTheDocument();
  });
});
