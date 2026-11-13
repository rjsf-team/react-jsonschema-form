import type { RJSFSchema } from '@rjsf/utils';
import { act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createFormComponent, createFormRef, handleOf } from './testUtils.tsx';

const user = userEvent.setup();

/** Mounts a form whose root offers the options `Old` and `New`, shown on `Old`, and switches to `New` */
async function switched(
  oldProperties: RJSFSchema['properties'],
  newProperties: RJSFSchema['properties'],
  data: object,
) {
  const schema: RJSFSchema = {
    type: 'object',
    oneOf: [
      { title: 'Old', properties: { kind: { const: 'old' }, ...oldProperties } },
      { title: 'New', properties: { kind: { const: 'new' }, ...newProperties } },
    ],
  };
  const { node, onChange } = createFormComponent({ schema, initialFormData: { kind: 'old', ...data } });
  const select = node.querySelector<HTMLSelectElement>('#root__oneof_select');
  if (!select) {
    throw new Error('The form rendered no option selector');
  }
  await user.selectOptions(select, 'New');
  const formData: unknown = onChange.mock.lastCall?.[0].formData;
  return formData;
}

describe('the data an anyOf/oneOf switch carries to the option switched to', () => {
  it('keeps a list the new option accepts where the old option declared no type for it (#5757)', async () => {
    const formData = await switched(
      { list: {} },
      { list: { type: 'array', items: { type: 'string' } } },
      { list: ['a', 'b'] },
    );

    expect(formData).toEqual({ kind: 'new', list: ['a', 'b'] });
  });

  it('keeps a list the new option accepts where the old option declared no items for it (#5757)', async () => {
    const formData = await switched(
      { list: { type: 'array' } },
      { list: { type: 'array', items: { type: 'string' } } },
      { list: ['a', 'b'] },
    );

    expect(formData).toEqual({ kind: 'new', list: ['a', 'b'] });
  });

  it("gives an object holding the old option's const the new option's", async () => {
    const formData = await switched({ cfg: { const: { a: 1 } } }, { cfg: { const: { a: 2 } } }, { cfg: { a: 1 } });

    expect(formData).toEqual({ kind: 'new', cfg: { a: 2 } });
  });

  it("starts an object the new option's const rejects over, as a field that held nothing starts", async () => {
    const oldProperties: RJSFSchema['properties'] = { cfg: { type: 'object', properties: { a: { type: 'number' } } } };
    const newProperties: RJSFSchema['properties'] = { cfg: { const: { a: 2 } } };

    const formData = await switched(oldProperties, newProperties, { cfg: { a: 9 } });

    // What the fill gives an object `const` is its own question (#5644), so the switch is held to the same answer
    expect(formData).toEqual(await switched(oldProperties, newProperties, {}));
    expect(formData).not.toHaveProperty('cfg.a', 9);
  });

  it('turns no string of a list into an empty row where the new option lists objects', async () => {
    const formData = await switched(
      { list: { type: 'array', items: { type: 'string' } } },
      { list: { type: 'array', items: { type: 'object', properties: { n: { type: 'string' } } } } },
      { list: ['x', 'y'] },
    );

    expect(formData).toEqual({ kind: 'new', list: [] });
  });
});

describe('a read-only field whose default changes', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: { mode: { enum: ['a', 'b'] }, rate: { type: 'number', readOnly: true } },
    if: { properties: { mode: { const: 'b' } }, required: ['mode'] },
    then: { properties: { rate: { default: 2 } } },
    else: { properties: { rate: { default: 1 } } },
  };

  it('takes the default a branch gives it in place of a value the seed held', async () => {
    const { node, onChange } = createFormComponent({ schema, initialFormData: { mode: 'a', rate: 7 } });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_mode') ?? node, 'b');

    expect(onChange.mock.lastCall?.[0].formData).toEqual({ mode: 'b', rate: 2 });
  });

  it('keeps a value written with setFieldValue(), which counts as entered', async () => {
    const ref = createFormRef();
    const { node, onChange } = createFormComponent({ schema, initialFormData: { mode: 'a' }, ref });
    act(() => handleOf(ref).setFieldValue(['rate'], 7));

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_mode') ?? node, 'b');

    expect(onChange.mock.lastCall?.[0].formData).toEqual({ mode: 'b', rate: 7 });
  });
});

describe('a value the seed held, once the form has worked out where it came from', () => {
  const schemaWith = (fallback: string): RJSFSchema => ({
    type: 'object',
    properties: { v: { type: 'string', default: fallback } },
  });

  it('is not taken for a default later, where it was not one when it was first judged', () => {
    const { rerender, getFormData } = createFormComponent({ schema: schemaWith('a'), initialFormData: { v: 'x' } });

    // The seed's `x` is not the default `a`, so it is the user's from here on, also once a default happens to equal it
    rerender({ schema: schemaWith('x') });
    rerender({ schema: schemaWith('b') });

    expect(getFormData()).toEqual({ v: 'x' });
  });

  it('follows the default from then on, where it was the default when it was first judged', () => {
    const { rerender, getFormData } = createFormComponent({ schema: schemaWith('a'), initialFormData: { v: 'a' } });

    rerender({ schema: schemaWith('b') });
    rerender({ schema: schemaWith('c') });

    expect(getFormData()).toEqual({ v: 'c' });
  });
});
