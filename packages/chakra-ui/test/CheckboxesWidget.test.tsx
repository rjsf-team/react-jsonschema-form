import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from './WrappedForm.tsx';

const user = userEvent.setup();

describe('CheckboxesWidget invalid state', () => {
  const schema: RJSFSchema = {
    type: 'object',
    required: ['picks'],
    properties: {
      picks: { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true, minItems: 2 },
    },
  };

  function renderForm(hideError: boolean) {
    return render(
      <Form
        schema={schema}
        uiSchema={{ picks: { 'ui:widget': 'checkboxes', ...(hideError ? { 'ui:hideError': true } : {}) } }}
        formData={{ picks: [] }}
        validator={validator}
      />,
    );
  }

  // The surrounding `FieldTemplate` marks its own fieldset invalid from the same errors, so these assert on the
  // checkboxes themselves; anything broader passes whatever the widget does with its `invalid` flag
  const invalidCheckboxes = (container: HTMLElement) =>
    container.querySelectorAll('input[type="checkbox"][aria-invalid="true"]');

  it('is not invalid before validation has found anything wrong', () => {
    const { container } = renderForm(false);

    expect(invalidCheckboxes(container)).toHaveLength(0);
  });

  it('is invalid once the field has errors', async () => {
    const { container } = renderForm(false);
    await user.click(container.querySelector('[type="submit"]')!);

    expect(invalidCheckboxes(container)).toHaveLength(2);
  });

  it('is not invalid when ui:hideError hides those errors', async () => {
    const { container } = renderForm(true);
    await user.click(container.querySelector('[type="submit"]')!);

    expect(invalidCheckboxes(container)).toHaveLength(0);
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

describe('CheckboxesWidget chakra option', () => {
  const widget = { 'ui:widget': 'checkboxes' };

  it.each([
    ['ui:options', { ...widget, 'ui:options': { chakra: { mb: 8 } } }],
    ['the ui:chakra shorthand', { ...widget, 'ui:chakra': { mb: 8 } }],
    ['ui:globalOptions', { ...widget, 'ui:globalOptions': { chakra: { mb: 8 } } }],
  ])('applies the style props set through %s to its fieldset', (_, uiSchema) => {
    const schema: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true };
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    // jsdom computes no style from Chakra's layered rules, so this reads the rule Emotion wrote for the widget's own
    // fieldset, the one inside the `FieldTemplate`'s
    const emotionClass = container.querySelector('fieldset fieldset')?.className.split(' ').at(-1);
    const css = Array.from(document.querySelectorAll('style'), (style) => style.textContent).join('');

    expect(emotionClass).toMatch(/^css-/);
    expect(css).toMatch(new RegExp(`\\.${emotionClass}\\{[^}]*margin-bottom:var\\(--chakra-spacing-8\\)`));
  });
});
