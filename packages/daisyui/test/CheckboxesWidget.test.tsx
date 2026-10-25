import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  required: ['choices'],
  properties: {
    choices: { type: 'array', title: 'Choices', items: { type: 'string', enum: ['a', 'b', 'c'] }, uniqueItems: true },
  },
};

describe('CheckboxesWidget and RadioWidget options', () => {
  test.each<[string, RJSFSchema, string]>([
    [
      'checkboxes',
      { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['one', 'two'] } },
      '.rjsf-checkbox',
    ],
    ['radio', { type: 'string', enum: ['one', 'two'] }, '.rjsf-radio'],
  ])('dims a disabled %s option through the class map, which also sets its cursor', (widget, schema, option) => {
    const { container } = render(
      <Form schema={schema} uiSchema={{ 'ui:widget': widget, 'ui:enumDisabled': ['two'] }} validator={validator} />,
    );

    const [one, two] = container.querySelectorAll(option);
    expect(one).toHaveClass('cursor-pointer', 'has-disabled:cursor-not-allowed');
    expect(one).not.toHaveClass('opacity-50');
    expect(two).toHaveClass('opacity-50');
    expect(two.querySelector('input')).toBeDisabled();
  });
});

describe('CheckboxesWidget', () => {
  // HTML5 constraint validation weighs each box on its own, so a `required` option demands *that* box — every box, for
  // a widget that puts the attribute on all of them. A radio group is the one place the attribute means "one of these",
  // because the browser reads same-named radios as a group; checkboxes share a name without sharing the requirement
  test('lets a required array be submitted with one option checked', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ choices: { 'ui:widget': 'checkboxes' } }}
        validator={validator}
        onSubmit={onSubmit}
        onError={onError}
      />,
    );

    const boxes = container.querySelectorAll('input[type=checkbox]');
    expect(boxes).toHaveLength(3);
    boxes.forEach((box) => expect(box).not.toHaveAttribute('required'));

    await user.click(boxes[0]);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // Constraint validation weighs each box on its own, so the attribute on every one of them asks for all of them:
    // the browser would stop a submit with one checked, prompting on the first unchecked box, so neither `onSubmit` nor
    // `onError` would run
    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit.mock.calls[0]?.[0].formData).toEqual({ choices: ['a'] });
  });
});

describe('CheckboxesWidget focus and blur', () => {
  it.each(['indexed', 'realValue'] as const)(
    'reports the focused option value in the %s format, apart from an option sharing its String() (#5315)',
    async (optionValueFormat) => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <Form
          schema={{ type: 'array', uniqueItems: true, items: { enum: [1, '1'] } }}
          uiSchema={{ 'ui:widget': 'checkboxes', 'ui:options': { optionValueFormat } }}
          validator={validator}
          onFocus={onFocus}
          onBlur={onBlur}
        />,
      );

      await user.tab();
      await user.tab();
      await user.tab();

      expect(onFocus.mock.calls).toEqual([
        ['root', 1],
        ['root', '1'],
      ]);
      expect(onBlur.mock.calls).toEqual([
        ['root', 1],
        ['root', '1'],
      ]);
    },
  );
});
