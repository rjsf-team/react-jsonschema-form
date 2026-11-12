import { createRef } from 'react';
import type { FieldProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormRef } from '../src/index.ts';
import Form, { useOptionSwitch } from '../src/index.ts';

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
  const { selectedOption, switchOption } = useOptionSwitch(props, options);
  return (
    <div>
      <output aria-label='shown'>{selectedOption}</output>
      {options.map((option, index) => (
        <button key={option.title} type='button' onClick={() => switchOption(index)}>
          {option.title}
        </button>
      ))}
      <button type='button' onClick={() => switchOption(-1)}>
        Clear
      </button>
    </div>
  );
}

function mounted(initialFormData: unknown, disabled = false) {
  const ref = createRef<FormRef>();
  render(
    <Form
      schema={schema}
      validator={validator}
      uiSchema={{ pet: { 'ui:field': ButtonsField, 'ui:fieldReplacesAnyOrOneOf': true } }}
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

  it('sets aside what only the old option declares, and brings it back with that option', async () => {
    const form = mounted({ pet: { kind: 'cat' } });
    form.set(['pet', 'lives'], 9);

    await form.pick('Dog');
    expect(form.data()).toEqual({ pet: { kind: 'dog', sound: 'woof' } });

    await form.pick('Cat');
    expect(form.data()).toEqual({ pet: { kind: 'cat', sound: 'meow', lives: 9 } });
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
});
