import { createRef } from 'react';
import type { FieldProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormRef } from '../src/index.ts';
import Form, { useOptionSwitch } from '../src/index.ts';
import { setupConsoleWarnSuppression } from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    pet: {
      type: 'object',
      anyOf: [
        {
          title: 'Cat',
          properties: {
            kind: { const: 'cat' },
            name: { type: 'string' },
            sound: { type: 'string', default: 'meow' },
            lives: { type: 'number' },
          },
        },
        {
          title: 'Dog',
          properties: { kind: { const: 'dog' }, name: { type: 'string' }, sound: { type: 'string', default: 'woof' } },
        },
        { title: 'None', type: 'null' },
      ],
    },
  },
};

/** A custom field that renders its own option buttons and leaves the option's fields to `SchemaField` */
function ButtonsField(props: FieldProps) {
  const { schema: fieldSchema, registry, formData } = props;
  const options = registry.schemaUtils.retrieveSchema(fieldSchema, formData).anyOf as RJSFSchema[];
  const { selectedOption, optionsUiSchema, switchOption } = useOptionSwitch(props, options);
  return (
    <div>
      <output aria-label='shown'>{selectedOption}</output>
      <output aria-label='option titles'>{optionsUiSchema.map((option) => option['ui:title']).join(',')}</output>
      {options.map((option, index) => (
        <button key={option.title} type='button' onClick={() => switchOption(index)}>
          {option.title}
        </button>
      ))}
      {options.map((option, index) => (
        <button key={option.title} type='button' onClick={() => switchOption(index, { stamped: true })}>
          Stamp {option.title}
        </button>
      ))}
      <button type='button' onClick={() => switchOption(-1)}>
        Clear
      </button>
    </div>
  );
}

function mounted(initialFormData: unknown, disabled = false, petUiSchema: UiSchema = {}) {
  const ref = createRef<FormRef>();
  render(
    <Form
      schema={schema}
      validator={validator}
      uiSchema={{ pet: { 'ui:field': ButtonsField, 'ui:fieldReplacesAnyOrOneOf': true, ...petUiSchema } }}
      initialFormData={initialFormData}
      disabled={disabled}
      ref={ref}
    />,
  );
  return {
    data: (): unknown => ref.current?.getFormData(),
    set: (path: (string | number)[], value: unknown) => act(() => ref.current?.setFieldValue(path, value)),
    pick: (title: string) => user.click(screen.getByRole('button', { name: title })),
    shown: () => screen.getByLabelText('shown').textContent,
    optionTitles: () => screen.getByLabelText('option titles').textContent,
  };
}

describe('useOptionSwitch() in a custom field', () => {
  it('shows the option the data matches', () => {
    const form = mounted({ pet: { kind: 'dog' } });

    expect(form.shown()).toBe('1');
  });

  it("switches the selection and gives the data the new option's const and default", async () => {
    const form = mounted({ pet: { kind: 'cat' } });
    expect(form.data()).toEqual({ pet: { kind: 'cat', sound: 'meow' } });

    await form.pick('Dog');

    expect(form.shown()).toBe('1');
    expect(form.data()).toEqual({ pet: { kind: 'dog', sound: 'woof' } });
  });

  it('keeps what the user entered that the new option declares too', async () => {
    const form = mounted({ pet: { kind: 'cat' } });
    form.set(['pet', 'name'], 'Rex');
    form.set(['pet', 'sound'], 'meow');

    await form.pick('Dog');

    expect(form.data()).toEqual({ pet: { kind: 'dog', name: 'Rex', sound: 'meow' } });
  });

  it('drops what only the old option declares, which stays gone after switching back', async () => {
    const form = mounted({ pet: { kind: 'cat' } });
    form.set(['pet', 'lives'], 9);

    await form.pick('Dog');
    expect(form.data()).toEqual({ pet: { kind: 'dog', sound: 'woof' } });

    await form.pick('Cat');
    expect(form.data()).toEqual({ pet: { kind: 'cat', sound: 'meow' } });
  });

  it('holds nothing on a null option, and starts the option switched to from its defaults', async () => {
    const form = mounted({ pet: { kind: 'cat' } });

    await form.pick('None');
    expect(form.shown()).toBe('2');
    expect(form.data()).toEqual({ pet: undefined });

    await form.pick('Dog');
    expect(form.data()).toEqual({ pet: { kind: 'dog', sound: 'woof' } });
  });

  it('clears the selection and the data for an index below 0', async () => {
    const form = mounted({ pet: { kind: 'cat' } });

    await form.pick('Clear');

    expect(form.data()).toEqual({ pet: undefined });
  });

  it('does nothing in a disabled form', async () => {
    const form = mounted({ pet: { kind: 'cat' } }, true);

    await form.pick('Dog');

    expect(form.shown()).toBe('0');
    expect(form.data()).toEqual({ pet: { kind: 'cat', sound: 'meow' } });
  });

  it("hands back the uiSchema of each option the field's uiSchema lists", () => {
    const form = mounted({ pet: { kind: 'cat' } }, false, {
      anyOf: [{ 'ui:title': 'Feline' }, { 'ui:title': 'Canine' }],
    });

    expect(form.optionTitles()).toBe('Feline,Canine');
  });

  describe('with a uiSchema.anyOf that is not an array', () => {
    const consoleWarnSuppression = setupConsoleWarnSuppression();

    it('hands back no option uiSchema, and warns once however often the field renders', () => {
      const form = mounted({ pet: { kind: 'cat' } }, false, {
        // @ts-expect-error: TS2353, deliberately not an array, to exercise the runtime warning below
        anyOf: { 'ui:title': 'Feline' },
      });
      form.set(['pet', 'name'], 'Tom');

      expect(form.optionTitles()).toBe('');
      const warnings = consoleWarnSuppression.consoleSpy.mock.calls.filter(
        ([message]) => message === 'uiSchema.anyOf is not an array for "root_pet" (pet)',
      );
      expect(warnings).toHaveLength(1);
    });
  });

  it("writes the field's own values into the data the switch sends", async () => {
    const form = mounted({ pet: { kind: 'cat' } });

    await form.pick('Stamp Dog');

    expect(form.shown()).toBe('1');
    expect(form.data()).toEqual({ pet: { kind: 'dog', sound: 'woof', stamped: true } });
  });

  it("writes the field's own values for the option already shown", async () => {
    const form = mounted({ pet: { kind: 'cat' } });

    await form.pick('Cat');
    expect(form.data()).toEqual({ pet: { kind: 'cat', sound: 'meow' } });

    await form.pick('Stamp Cat');
    expect(form.shown()).toBe('0');
    expect(form.data()).toEqual({ pet: { kind: 'cat', sound: 'meow', stamped: true } });
  });

  it('leaves a null option holding nothing, whatever own values the field passes', async () => {
    const form = mounted({ pet: { kind: 'cat' } });

    await form.pick('Stamp None');

    expect(form.shown()).toBe('2');
    expect(form.data()).toEqual({ pet: undefined });
  });
});
