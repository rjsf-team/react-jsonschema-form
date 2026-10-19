import { formTests, themeTests } from '@rjsf/snapshot-tests';
import type { FormValidation, RegistryWidgetsType, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { bracketNameGenerator, errorId, fieldLabelId, helpId, optionHelpId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import CheckboxWidget from '../src/CheckboxWidget/index.ts';
import Form, { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

/** Checks that every id a `for`, an `aria-labelledby` or an `aria-describedby` in `container` names belongs to an element
 * there
 */
function expectReferencesResolve(container: HTMLElement) {
  container.querySelectorAll('label[for]').forEach((label) => {
    expect(container.querySelector(`[id="${label.getAttribute('for')}"]`)).toBeInTheDocument();
  });
  container.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach((element) => {
    [element.getAttribute('aria-labelledby'), element.getAttribute('aria-describedby')]
      .join(' ')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((referencedId) => expect(container.querySelector(`[id="${referencedId}"]`)).toBeInTheDocument());
  });
}

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('a checkbox whose presentation gives its label and description to the template', () => {
  test('draws each once, from the template', () => {
    const { container } = render(
      <Form
        schema={{ type: 'boolean', title: 'Bee', description: 'Bee description' }}
        uiSchema={{ 'ui:widget': 'checkbox' }}
        presentation={{ widgets: { CheckboxWidget: { label: 'template', description: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('Bee')).toHaveLength(1);
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Bee');
    expect(screen.getAllByText('Bee description')).toHaveLength(1);
    expect(container.querySelector('#root__description')).toHaveTextContent('Bee description');
  });
});

describe("shadcn widgets carry their field's plan on the element a user focuses", () => {
  test.each<[string, RJSFSchema, UiSchema]>([
    ['text', { type: 'string' }, {}],
    ['number', { type: 'number' }, {}],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
    // The slider's thumb, which a user focuses, carries the id rather than the slider around it, and is named by the
    // label through `aria-labelledby`, since a `for` can't name it
    ['range', { type: 'number' }, { 'ui:widget': 'range' }],
    // The checkbox, which carries its id, takes the plan rather than the <div> around it
    ['checkbox', { type: 'boolean' }, {}],
  ])('a %s control is invalid, styled so, and described only by elements that render', (_, schema, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: uiSchema }}
        extraErrors={{ pet: { __errors: ['too short'] } }}
        validator={validator}
      />,
    );

    const control = container.querySelector('#root_pet');
    expect(control).toHaveAccessibleName('Pet');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveClass('border-destructive');
    expect(control).toHaveAttribute('aria-describedby', 'root_pet__error');
    expect(control).toHaveAccessibleDescription('too short');
    expect(container.querySelectorAll('[aria-describedby]')).toHaveLength(1);
    expectReferencesResolve(container);
  });

  test("names a range's form value by htmlName, and draws its label with no `for`", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', required: ['volume'], properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        initialFormData={{ volume: 3 }}
        nameGenerator={bracketNameGenerator}
        validator={validator}
      />,
    );

    expect(container.querySelector('input[name="root[volume]"]')).toHaveValue('3');
    const volumeLabel = container.querySelector(`#${fieldLabelId('root_volume')}`)?.closest('label');
    expect(volumeLabel).not.toHaveAttribute('for');
    expect(volumeLabel).toHaveTextContent('Volume*');
    expect(screen.getByRole('slider')).toHaveAccessibleName('Volume');
  });

  test("focuses a range's thumb under ui:autofocus once Radix draws it", async () => {
    // jsdom focuses an element a browser can't, one drawn `display: none`, as Radix draws the thumb until a render
    // after it mounts, so the thumb's display is read as it takes focus
    const displaysOnFocus: string[] = [];
    const recordDisplay = ({ target }: FocusEvent) => displaysOnFocus.push((target as HTMLElement).style.display);
    document.addEventListener('focusin', recordDisplay);
    try {
      render(
        <Form
          schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
          uiSchema={{ volume: { 'ui:widget': 'range', 'ui:autofocus': true } }}
          initialFormData={{ volume: 3 }}
          validator={validator}
        />,
      );

      await waitFor(() => expect(screen.getByRole('slider')).toHaveFocus());
      expect(displaysOnFocus).toEqual(['']);
    } finally {
      document.removeEventListener('focusin', recordDisplay);
    }
  });

  test('gives the field id and ui:autofocus to the first thumb alone of a range of several values, naming every thumb', async () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{
          volume: { 'ui:widget': 'range', 'ui:autofocus': true, 'ui:options': { props: { value: [2, 5] } } },
        }}
        validator={validator}
      />,
    );

    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(2);
    expect(container.querySelectorAll('#root_volume')).toHaveLength(1);
    expect(thumbs[0]).toHaveAttribute('id', 'root_volume');
    await waitFor(() => expect(thumbs[0]).toHaveFocus());
    for (const thumb of thumbs) {
      expect(thumb).toHaveAccessibleName('Volume');
    }
  });

  test("draws an empty range's thumb at its minimum without giving the form that value", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        onChange={onChange}
        validator={validator}
      />,
    );

    const thumb = screen.getByRole('slider');
    expect(thumb).toBeVisible();
    expect(thumb).toHaveAttribute('aria-valuenow', '2');
    await user.tab();
    expect(thumb).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('input[name="root_volume"]')).not.toBeInTheDocument();
  });

  test.each(['{Home}', '{ArrowLeft}', '{PageDown}'])(
    "commits an empty range's minimum on %s, which leaves its thumb there",
    async (key) => {
      const onChange = vi.fn();
      render(
        <Form
          schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
          uiSchema={{ volume: { 'ui:widget': 'range' } }}
          onChange={onChange}
          validator={validator}
        />,
      );

      await user.tab();
      await user.keyboard(key);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.lastCall?.[0].formData).toEqual({ volume: 2 });
    },
  );

  describe('pressed with a pointer', () => {
    // jsdom has no pointer capture, which Radix's slider takes on a press and releases on letting go
    const captured = new Set<number>();
    beforeEach(() => {
      Object.assign(Element.prototype, {
        setPointerCapture: (pointerId: number) => captured.add(pointerId),
        hasPointerCapture: (pointerId: number) => captured.has(pointerId),
        releasePointerCapture: (pointerId: number) => captured.delete(pointerId),
      });
    });
    afterEach(() => {
      captured.clear();
      const prototype: Partial<Element> = Element.prototype;
      delete prototype.setPointerCapture;
      delete prototype.hasPointerCapture;
      delete prototype.releasePointerCapture;
    });

    test("commits an empty range's minimum when its thumb is pressed where it is drawn", async () => {
      const onChange = vi.fn();
      render(
        <Form
          schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
          uiSchema={{ volume: { 'ui:widget': 'range' } }}
          onChange={onChange}
          validator={validator}
        />,
      );

      await user.click(screen.getByRole('slider'));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.lastCall?.[0].formData).toEqual({ volume: 2 });
    });

    test('commits nothing when a press that began elsewhere is released on an empty range', async () => {
      const onChange = vi.fn();
      render(
        <>
          <p>Before</p>
          <Form
            schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
            uiSchema={{ volume: { 'ui:widget': 'range' } }}
            onChange={onChange}
            validator={validator}
          />
        </>,
      );
      const thumb = screen.getByRole('slider');
      const released = vi.fn();
      thumb.addEventListener('pointerup', released);

      await user.pointer([
        { keys: '[MouseLeft>]', target: screen.getByText('Before') },
        { target: thumb },
        { keys: '[/MouseLeft]' },
      ]);

      expect(released).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
    });

    test('commits nothing when a press on an empty range is cancelled before its release', async () => {
      const onChange = vi.fn();
      render(
        <Form
          schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
          uiSchema={{ volume: { 'ui:widget': 'range' } }}
          onChange={onChange}
          validator={validator}
        />,
      );
      const thumb = screen.getByRole('slider');

      await user.pointer({ keys: '[MouseLeft>]', target: thumb });
      // user-event has no way to cancel a pointer, as a touch that turns into a scroll does
      thumb.dispatchEvent(new Event('pointercancel', { bubbles: true }));
      await user.pointer({ keys: '[/MouseLeft]', target: thumb });

      expect(onChange).not.toHaveBeenCalled();
    });

    test('commits nothing for a press on an empty range that ui:options.props disables', async () => {
      const onChange = vi.fn();
      render(
        <Form
          schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
          uiSchema={{ volume: { 'ui:widget': 'range', 'ui:options': { props: { disabled: true } } } }}
          onChange={onChange}
          validator={validator}
        />,
      );

      await user.click(screen.getByRole('slider'));

      expect(screen.getByRole('slider')).toHaveAttribute('data-disabled');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  test('commits nothing on the release of a key held on an empty range as focus left it', async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        onChange={onChange}
        validator={validator}
      />,
    );

    await user.tab();
    await user.keyboard('{Home>}');
    await user.tab();
    await user.tab({ shift: true });
    expect(screen.getByRole('slider')).toHaveFocus();
    await user.keyboard('{/Home}');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('gives an empty range no form value under a name ui:options.props sets', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
        uiSchema={{ volume: { 'ui:widget': 'range', 'ui:options': { props: { name: 'level' } } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('input[name="level"]')).not.toBeInTheDocument();
  });

  test('calls an onValueChange ui:options.props gives a range, and still commits only the value a key moves it to', async () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
        uiSchema={{ volume: { 'ui:widget': 'range', 'ui:options': { props: { onValueChange } } } }}
        onChange={onChange}
        validator={validator}
      />,
    );

    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(onValueChange).toHaveBeenCalledWith([3]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.lastCall?.[0].formData).toEqual({ volume: 3 });
  });

  test('leaves a range that started empty empty when its form is reset', async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        onChange={onChange}
        validator={validator}
      >
        <button type='reset'>Reset</button>
      </Form>,
    );

    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onChange.mock.lastCall?.[0].formData).toEqual({ volume: 3 });
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onChange.mock.lastCall?.[0].formData.volume).toBeUndefined();
  });

  test("focuses a range's thumb only on mount, not when ui:autofocus turns true later", async () => {
    const schema: RJSFSchema = { type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } };
    const { rerender } = render(
      <Form
        schema={schema}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        initialFormData={{ volume: 3 }}
        validator={validator}
      />,
    );

    rerender(
      <Form
        schema={schema}
        uiSchema={{ volume: { 'ui:widget': 'range', 'ui:autofocus': true } }}
        initialFormData={{ volume: 3 }}
        validator={validator}
      />,
    );
    await new Promise((resolve) => {
      setTimeout(resolve);
    });

    expect(screen.getByRole('slider')).not.toHaveFocus();
  });

  test("draws an empty range's thumb at the minimum ui:options gives its slider, and commits that", async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{ volume: { 'ui:widget': 'range', 'ui:options': { props: { min: 5 } } } }}
        onChange={onChange}
        validator={validator}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '5');
    await user.tab();
    await user.keyboard('{Home}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.lastCall?.[0].formData).toEqual({ volume: 5 });
  });

  test("commits only the value a key moves an empty range's thumb to", async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume', minimum: 2 } } }}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        onChange={onChange}
        validator={validator}
      />,
    );

    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.lastCall?.[0].formData).toEqual({ volume: 3 });
  });

  test("reports a range's value as its thumb takes and loses focus", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { volume: { type: 'integer', title: 'Volume' } } }}
        uiSchema={{ volume: { 'ui:widget': 'range' } }}
        initialFormData={{ volume: 3 }}
        onFocus={onFocus}
        onBlur={onBlur}
        validator={validator}
      />,
    );

    await user.tab();
    await user.tab();

    expect(onFocus.mock.calls).toEqual([['root_volume', 3]]);
    expect(onBlur.mock.calls).toEqual([['root_volume', 3]]);
  });

  test("names a radio group's form value by htmlName", () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio' } }}
        initialFormData={{ color: 'blue' }}
        nameGenerator={bracketNameGenerator}
        validator={validator}
      />,
    );

    expect(container.querySelector('form')).toHaveFormValues({ 'root[color]': '1' });
  });

  test("reports a radio group's focus once, with the radio's value, when focusOnFirstError focuses it", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio' } }}
        onFocus={onFocus}
        onBlur={onBlur}
        focusOnFirstError
        customValidate={(_: unknown, errors: FormValidation<{ color?: unknown }>) => {
          errors.color?.addError('bad');
          return errors;
        }}
        validator={validator}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByRole('radio', { name: 'red' })).toHaveFocus();
    expect(onFocus.mock.calls).toEqual([['root_color', 'red']]);
    expect(onBlur).not.toHaveBeenCalled();
  });

  test("focuses a radio group's first radio under ui:autofocus", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', title: 'Color', enum: ['red', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radio', { name: 'red' })).toHaveFocus();
  });

  const colors: RJSFSchema = { type: 'string', title: 'Color', enum: ['red', 'blue'] };
  // ARIA supports `aria-invalid` on a `radiogroup` but not on a `group`, so a radio group carries it in place of its
  // radios while each checkbox carries its own. The label names the group with no `for`, which would name its wrapper
  test.each([
    ['radio', colors, 'radiogroup', 'radio', 'true', null],
    [
      'checkboxes',
      { type: 'array', title: 'Color', items: colors, uniqueItems: true },
      'group',
      'checkbox',
      null,
      'true',
    ],
  ] as const)(
    'names a %s group by its label, marks the group or each option invalid, and styles and describes each option by its errors',
    (widget, color, role, item, groupInvalid, optionInvalid) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { color } }}
          uiSchema={{ color: { 'ui:widget': widget } }}
          extraErrors={{ color: { __errors: ['pick one'] } }}
          validator={validator}
        />,
      );

      const group = container.querySelector('#root_color');
      expect(group).toHaveRole(role);
      expect(group).toHaveAccessibleName('Color');
      expect(group?.getAttribute('aria-invalid')).toBe(groupInvalid);
      expect(container.querySelector(`#${fieldLabelId('root_color')}`)?.closest('label')).not.toHaveAttribute('for');
      for (const option of screen.getAllByRole(item)) {
        expect(option.getAttribute('aria-invalid')).toBe(optionInvalid);
        expect(option).toHaveClass('border-destructive');
        expect(option).toHaveAccessibleDescription('pick one');
      }
      expectReferencesResolve(container);
    },
  );
});

describe('shadcn focusOnFirstError', () => {
  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['text input', { type: 'string' }, {}, '#root_x'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, '#root_x'],
    ['checkbox', { type: 'boolean' }, {}, '#root_x'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, '#root_x'],
    ['range', { type: 'number' }, { 'ui:widget': 'range' }, '#root_x'],
    // A group's wrapper carries the field's id: the checkboxes' isn't focusable, and Radix's radiogroup passes its focus
    // on, so the first control is focused
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, '#root_x-0'],
    [
      'checkboxes group',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      '#root_x-0',
    ],
  ])('moves focus to a %s with errors', async (_, x, ui, focused) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { ...x, title: 'X' } } }}
        uiSchema={{ x: ui }}
        validator={validator}
        focusOnFirstError
        customValidate={(_: unknown, errors: FormValidation<{ x?: unknown }>) => {
          errors.x?.addError('bad');
          return errors;
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // jsdom focuses an element a browser hides with `display: none`, which a browser can't focus
    expect(container.querySelector(focused)).toBeVisible();
    expect(container.querySelector(focused)).toHaveFocus();
  });
});

describe('shadcn templates', () => {
  test.each([
    ['declares it holds false unchecked', { uncheckedIsFalse: true }, 'Foo'],
    ['declares nothing', {}, 'Foo*'],
  ])("marks the template's label for a switch that %s only where its plan says", (_, declaration, text) => {
    const SwitchWidget = () => null;
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { foo: { type: 'boolean', title: 'Foo' } }, required: ['foo'] }}
        uiSchema={{ foo: { 'ui:widget': 'SwitchWidget' } }}
        widgets={{ SwitchWidget }}
        presentation={{ widgets: { SwitchWidget: { ...declaration, label: 'template' } } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('label[for="root_foo"]')?.textContent).toBe(text);
  });

  test("names a required object's option selector by its heading's text, without the marker beside it", () => {
    const pet: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      properties: { name: { type: 'string' } },
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };
    const { container } = render(
      <Form schema={{ type: 'object', properties: { pet }, required: ['pet'] }} validator={validator} />,
    );

    expect(container.querySelector('#root_pet_XxxOf__title')).toHaveTextContent(/^Pet$/);
    expect(container.querySelector('#root_pet_XxxOf__title')?.parentElement).toHaveTextContent(/^Pet\*$/);
    expect(container.querySelector('#root_pet__anyof_select')).toHaveAccessibleName('Pet');
  });

  test("names a radio anyOf option selector's group by its field's label", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { pick: { title: 'Pick', anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }] } },
        }}
        uiSchema={{ pick: { 'ui:widget': 'radio' } }}
        validator={validator}
      />,
    );

    const firstOption = container.querySelector('#root_pick__anyof_select-0')!;
    expect(firstOption.closest('[role="radiogroup"]')).toHaveAccessibleName('Pick');
    expectReferencesResolve(container);
  });

  test("keeps an optional object's data control where ui:label turns its heading off", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { pet: { type: 'object', title: 'Pet', properties: { a: { type: 'string' } } } },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] }, pet: { 'ui:label': false } }}
        initialFormData={{ pet: { a: 'x' } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_pet__title')).not.toBeInTheDocument();
    expect(container.querySelector('#root_pet__optionalRemove')).toBeInTheDocument();
  });

  test("draws no heading for an array option whose ui:title repeats its field's label", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            tags: { type: 'array', items: { type: 'string' }, anyOf: [{ maxItems: 3 }, { minItems: 1 }] },
          },
        }}
        uiSchema={{ tags: { 'ui:title': 'Tags', anyOf: [{ 'ui:title': 'Tags' }, {}] } }}
        validator={validator}
      />,
    );

    expect(container.querySelector(`#${fieldLabelId('root_tags')}`)).toHaveTextContent('Tags');
    expect(container.querySelector('#root_tags__title')).not.toBeInTheDocument();
  });

  test("keeps an optional array option's data control where a field above draws its heading", () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            tags: {
              title: 'Tags',
              anyOf: [
                { type: 'array', items: { type: 'string' } },
                { type: 'array', items: { type: 'number' } },
              ],
            },
          },
        }}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['array'] } }}
        initialFormData={{ tags: ['a'] }}
        validator={validator}
      />,
    );

    expect(container.querySelector(`#${fieldLabelId('root_tags')}`)).toHaveTextContent('Tags');
    expect(container.querySelector('#root_tags__title')).not.toBeInTheDocument();
    expect(container.querySelector('#root_tags__optionalRemove')).toBeInTheDocument();
  });
});

describe("shadcn's error and help elements carry the ids their field's plan describes its control by", () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      pet: {
        title: 'Pet',
        anyOf: [
          { title: 'Dog', type: 'string' },
          { title: 'Cat', type: 'number' },
        ],
      },
    },
  };

  test("renders an option's own help as a block under its own id, beside the field's", () => {
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ pet: { 'ui:help': 'Pick a pet', anyOf: [{ 'ui:help': 'Dogs bark' }, {}] } }}
        validator={validator}
      />,
    );

    expect(container.querySelectorAll(`#${helpId('root_pet')}`)).toHaveLength(1);
    expect(container.querySelector(`div#${helpId('root_pet')}`)).toHaveTextContent('Pick a pet');
    expect(container.querySelector(`div#${optionHelpId('root_pet')}`)).toHaveTextContent('Dogs bark');
    expect(container.querySelector('#root_pet')).toHaveAccessibleDescription('Pick a pet Dogs bark');
  });

  test("renders an anyOf field's errors once, under the id its control is described by", () => {
    const { container } = render(
      <Form schema={schema} extraErrors={{ pet: { __errors: ['pick one'] } }} validator={validator} />,
    );

    expect(container.querySelectorAll(`#${errorId('root_pet')}`)).toHaveLength(1);
    expect(container.querySelector('#root_pet')).toHaveAccessibleDescription('pick one');
  });
});

describe('shadcn names a control whose label ui:label false hides', () => {
  test.each<[string, string, RJSFSchema, UiSchema]>([
    ['text input', 'textbox', { type: 'string' }, {}],
    ['radio group', 'radiogroup', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }],
    [
      'checkboxes group',
      'group',
      { type: 'array', items: { enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
    ],
    ['range', 'slider', { type: 'number' }, { 'ui:widget': 'range' }],
  ])('names a %s by the label text ui:label false hides', (_, role, schema, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { pet: { ...schema, title: 'Pet' } } }}
        uiSchema={{ pet: { ...uiSchema, 'ui:label': false } }}
        validator={validator}
      />,
    );

    expect(screen.queryByText('Pet')).toBeNull();
    expect(screen.getByRole(role)).toHaveAccessibleName('Pet');
    expectReferencesResolve(container);
  });
});

describe('shadcn labels', () => {
  test.each(['alt-date', 'alt-datetime'])("names the %s parts' group by the template's label", (widget) => {
    render(
      <Form
        schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
        uiSchema={{ when: { 'ui:widget': widget } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('group', { name: 'When' })).toHaveAttribute('id', 'root_when');
  });
});

describe('shadcn key inputs', () => {
  test("names the additional property key's input by its label where ui:label: false hides it", () => {
    render(
      <Form
        schema={{ type: 'object', additionalProperties: { type: 'string' } }}
        uiSchema={{ additionalProperties: { 'ui:label': false } }}
        initialFormData={{ first: 'a' }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'first Key' })).toHaveAttribute('id', 'root_first-key');
  });
});

describe('shadcn focuses its groups as core does', () => {
  test.each<[string, RJSFSchema, string]>([
    ['radio', { type: 'string', enum: ['red', 'green'] }, 'radio'],
    ['checkboxes', { type: 'array', items: { type: 'string', enum: ['red', 'green'] }, uniqueItems: true }, 'checkbox'],
  ])('focuses the first %s a user can choose under ui:autofocus', (widget, color, role) => {
    render(
      <Form
        schema={{ type: 'object', properties: { color } }}
        uiSchema={{ color: { 'ui:widget': widget, 'ui:autofocus': true, 'ui:enumDisabled': ['red'] } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole(role)[1]).toHaveFocus();
  });

  test("focuses a radio group's checked radio under ui:autofocus, where Tab into the group lands", () => {
    render(
      <Form
        schema={{ type: 'object', properties: { color: { type: 'string', enum: ['red', 'green', 'blue'] } } }}
        uiSchema={{ color: { 'ui:widget': 'radio', 'ui:autofocus': true } }}
        initialFormData={{ color: 'blue' }}
        validator={validator}
      />,
    );

    expect(screen.getAllByRole('radio')[2]).toHaveFocus();
  });
});

// HTML5 constraint validation fails an unchecked required box and blocks the submit before RJSF sees it, so neither
// onSubmit nor onError runs and the browser asks the user to check a box the schema lets them leave unchecked. Only a
// required boolean the schema demands be true carries the attribute (#5388)
describe('shadcn CheckboxWidget required attribute', () => {
  const agree: RJSFSchema = { type: 'boolean', title: 'Agree' };
  const formSchema = (field: RJSFSchema): RJSFSchema => ({
    type: 'object',
    required: ['agree'],
    properties: { agree: field },
  });

  test('submits a required boolean left unchecked, whose false the schema accepts', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Form schema={formSchema(agree)} validator={validator} onSubmit={onSubmit} onError={onError} />,
    );

    expect(container.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { agree: false } }),
      expect.anything(),
    );
  });

  test('keeps the attribute on a required boolean that has to be true', () => {
    const { container } = render(<Form schema={formSchema({ ...agree, const: true })} validator={validator} />);

    expect(container.querySelector('input[type=checkbox]')).toHaveAttribute('required');
  });

  // Rendered without a plan, as outside SchemaField, the widget gets its parent's `required` as is, so the attribute
  // has to follow both it and the schema: a required box whose `false` the schema accepts, and an optional one that
  // has to be true but is left unanswered, each hold data the schema accepts, which the browser would refuse.
  // Radix renders the input the browser validates only inside a form
  test.each<[string, RJSFSchema, boolean, boolean | undefined]>([
    ['a required boolean whose false the schema accepts', agree, true, false],
    ['an optional boolean that has to be true', { ...agree, const: true }, false, undefined],
  ])('leaves the attribute off %s, rendered without a plan', (_, schema, required, value) => {
    const { container } = render(
      <form>
        <CheckboxWidget {...makeWidgetMockProps({ schema, value, required, readonly: false })} />
      </form>,
    );

    expect(container.querySelector('input[type=checkbox]')).not.toHaveAttribute('required');
  });
});

describe("shadcn marks a deprecated field's label, as core does", () => {
  test.each<[string, RJSFSchema, UiSchema, string]>([
    ['text input', { type: 'string' }, {}, 'textbox'],
    ['number input', { type: 'number' }, {}, 'textbox'],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }, 'textbox'],
    ['range', { type: 'number' }, { 'ui:widget': 'range' }, 'slider'],
    ['checkbox', { type: 'boolean' }, {}, 'checkbox'],
    ['select', { type: 'string', enum: ['a', 'b'] }, {}, 'combobox'],
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, 'radiogroup'],
    [
      'checkboxes group',
      { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
      { 'ui:widget': 'checkboxes' },
      'group',
    ],
  ])('names a deprecated %s by its label with the Deprecated marker', (_, x, ui, role) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { ...x, title: 'X', deprecated: true } } }}
        uiSchema={{ x: ui }}
        validator={validator}
      />,
    );

    expect(screen.getByRole(role, { name: 'X (deprecated)' })).toHaveAttribute('id', 'root_x');
    expect(container.innerHTML).not.toContain('(deprecated) (deprecated)');
  });

  // cmdk replaces the id of the multiple select's input with one of its own (#5478), so only its name is checked
  test('names a deprecated multi-select by its label with the Deprecated marker', () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            x: {
              type: 'array',
              title: 'X',
              deprecated: true,
              items: { type: 'string', enum: ['a', 'b'] },
              uniqueItems: true,
            },
          },
        }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'X (deprecated)' })).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('(deprecated) (deprecated)');
  });
});

describe('a checkbox named by any spelling of ui:widget (#5389)', () => {
  const CheckboxWrapper = (props: WidgetProps) => <CheckboxWidget {...props} />;
  const schema: RJSFSchema = {
    type: 'object',
    properties: { agree: { type: 'boolean', title: 'Agree', description: 'I accept the terms' } },
  };

  test.each<[string, UiSchema, RegistryWidgetsType?]>([
    ['the checkbox alias', { 'ui:widget': 'checkbox' }],
    ['the CheckboxWidget key', { 'ui:widget': 'CheckboxWidget' }],
    ['the CheckboxWidget key through ui:options.widget', { 'ui:options': { widget: 'CheckboxWidget' } }],
    ['the registered widget passed as a component', { 'ui:widget': CheckboxWidget }],
    [
      'a wrapper registered under the CheckboxWidget key',
      { 'ui:widget': 'CheckboxWidget' },
      { CheckboxWidget: CheckboxWrapper },
    ],
    ['an unregistered wrapper passed as a component', { 'ui:widget': CheckboxWrapper }],
  ])('draws the label and the description once, named by %s', (_, agreeUiSchema, widgets) => {
    const { container } = render(
      <Form schema={schema} uiSchema={{ agree: agreeUiSchema }} widgets={widgets} validator={validator} />,
    );

    expect(screen.getAllByText('Agree')).toHaveLength(1);
    expect(screen.getAllByText('I accept the terms')).toHaveLength(1);
    expect(screen.getByRole('checkbox', { name: 'Agree' })).toBeInTheDocument();
    expect(container.querySelectorAll('#root_agree__description')).toHaveLength(1);
  });
});
