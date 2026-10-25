import type { RJSFSchema } from '@rjsf/utils';
import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { FormRef } from '../src/index.ts';
import { createFormComponent, createFormRef, fieldErrorsById, handleOf, input } from './testUtils.tsx';

const user = userEvent.setup();

function mountWithHandle(props: Parameters<typeof createFormComponent>[0]) {
  const ref = createFormRef();
  const result = createFormComponent({ ...props, ref });
  const handle: FormRef = handleOf(ref);
  return { ...result, handle };
}

/** The status members of the last event `onChange` was called with */
function lastStatus(onChange: Mock) {
  const event: unknown = onChange.mock.lastCall?.[0];
  if (typeof event !== 'object' || event === null) {
    throw new Error('onChange has not been called');
  }
  return {
    dirty: Reflect.get(event, 'dirty'),
    dirtyFields: Reflect.get(event, 'dirtyFields'),
    submitCount: Reflect.get(event, 'submitCount'),
  };
}

const person: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: 'Ada' },
    address: { type: 'object', properties: { street: { type: 'string' }, city: { type: 'string' } } },
  },
};

describe('dirty', () => {
  it('starts clean, schema defaults included', () => {
    const { handle, onChange } = mountWithHandle({ schema: person });

    expect(handle.getFormData()).toEqual({ name: 'Ada' });
    expect(handle.getStatus()).toMatchObject({ dirty: false, dirtyFields: {}, submitCount: 0 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the edited path of a nested object in dirtyFields', async () => {
    const { container, onChange, handle } = mountWithHandle({ schema: person });

    await user.type(input(container, 'root_address_street'), 'x');

    expect(lastStatus(onChange)).toEqual({ dirty: true, dirtyFields: { address: { street: true } }, submitCount: 0 });
    expect(handle.getStatus()).toMatchObject(lastStatus(onChange));
  });

  it("leaves a cleared field seeded with '' dirty, unless ui:emptyValue stores '' for it", async () => {
    const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
    const plain = mountWithHandle({ schema, initialFormData: { name: '' } });
    await user.type(input(plain.container, 'root_name'), 'x');
    await user.clear(input(plain.container, 'root_name'));
    expect(plain.handle.getStatus()).toMatchObject({ dirty: true, dirtyFields: { name: true }, submitCount: 0 });
    plain.unmount();

    const withEmptyValue = mountWithHandle({
      schema,
      uiSchema: { name: { 'ui:emptyValue': '' } },
      initialFormData: { name: '' },
    });
    await user.type(input(withEmptyValue.container, 'root_name'), 'x');
    await user.clear(input(withEmptyValue.container, 'root_name'));

    expect(withEmptyValue.handle.getStatus()).toMatchObject({ dirty: false, dirtyFields: {}, submitCount: 0 });
  });

  it('marks the edited item of an array in dirtyFields', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } } },
    };
    const { container, onChange } = mountWithHandle({
      schema,
      initialFormData: { items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] },
    });

    await user.type(input(container, 'root_items_1_name'), 'x');

    expect(lastStatus(onChange).dirtyFields).toEqual({ items: [undefined, { name: true }, undefined] });
  });

  it('marks an added array item and a removed property in dirtyFields', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } },
    };
    const { handle } = mountWithHandle({ schema, initialFormData: { tags: ['a'], note: 'n' } });

    act(() => handle.setFieldValue('tags', ['a', 'b']));
    act(() => handle.setFieldValue('note', undefined));

    expect(handle.getStatus().dirtyFields).toEqual({ tags: [undefined, true], note: true });
  });

  it('is clean again once an edit is undone', async () => {
    const { container, onChange } = mountWithHandle({ schema: person, initialFormData: { name: 'Ada' } });
    const name = input(container, 'root_name');

    await user.type(name, 'm');
    expect(lastStatus(onChange).dirty).toBe(true);
    await user.type(name, '{Backspace}');

    expect(lastStatus(onChange)).toEqual({ dirty: false, dirtyFields: {}, submitCount: 0 });
  });

  it('stays clean when a new schema prop fills in a default', () => {
    const { handle, rerender } = mountWithHandle({ schema: person });

    rerender({
      schema: { ...person, properties: { ...person.properties, age: { type: 'number', default: 30 } } },
    });

    expect(handle.getFormData()).toEqual({ name: 'Ada', age: 30 });
    expect(handle.getStatus()).toMatchObject({ dirty: false, dirtyFields: {}, submitCount: 0 });
  });

  it('keeps only the edit dirty when a new schema prop fills in a default after it', async () => {
    const { container, handle, rerender } = mountWithHandle({ schema: person });
    await user.type(input(container, 'root_address_city'), 'x');

    rerender({
      schema: { ...person, properties: { ...person.properties, age: { type: 'number', default: 30 } } },
    });

    expect(handle.getFormData()).toEqual({ name: 'Ada', address: { city: 'x' }, age: 30 });
    expect(handle.getStatus().dirtyFields).toEqual({ address: { city: true } });
  });

  it.each(['onChange', 'onBlur'] as const)(
    'is clean after an edit is undone when liveOmit %s drops extra data',
    async (liveOmit) => {
      const { container, handle } = mountWithHandle({
        schema: person,
        initialFormData: { name: 'Ada', extra: 1 },
        omitExtraData: true,
        liveOmit,
      });
      const name = input(container, 'root_name');

      await user.type(name, 'm');
      await user.tab();
      expect(handle.getFormData()).not.toHaveProperty('extra');
      expect(handle.getStatus().dirty).toBe(true);
      await user.type(name, '{Backspace}');
      await user.tab();

      expect(handle.getStatus()).toMatchObject({ dirty: false, dirtyFields: {}, submitCount: 0 });
    },
  );

  it('is clean after a submit that omitted extra data', async () => {
    const { handle, onSubmit } = mountWithHandle({
      schema: person,
      initialFormData: { name: 'Ada', extra: 1 },
      omitExtraData: true,
    });

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(handle.getFormData()).not.toHaveProperty('extra');
    expect(handle.getStatus().dirty).toBe(false);
  });

  it('counts the data an if/then switch drops after the user changed the field that decides it', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { kind: { type: 'string', enum: ['a', 'b'] } },
      if: { properties: { kind: { const: 'a' } } },
      then: { properties: { detail: { type: 'string', default: 'x' } } },
    };
    const { container, onChange } = mountWithHandle({ schema, initialFormData: { kind: 'a' } });
    const select = container.querySelector('#root_kind');
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error('There is no select #root_kind');
    }

    await user.selectOptions(select, 'b');

    expect(onChange.mock.lastCall?.[0].formData).toEqual({ kind: 'b' });
    expect(lastStatus(onChange)).toEqual({
      dirty: true,
      dirtyFields: { kind: true, detail: true },
      submitCount: 0,
    });
  });

  it('keeps every item a keystroke did not reach identical to the data the form started from', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } } },
    };
    const initialFormData = { items: Array.from({ length: 50 }, (_, index) => ({ name: `item ${index}` })) };
    const ref = createFormRef<{ items: { name: string }[] }>();
    const { container } = createFormComponent({ schema, initialFormData, ref });
    const handle = handleOf(ref);
    const before = handle.getFormData();

    await user.type(input(container, 'root_items_7_name'), 'x');

    const changed = handle.getFormData().items.flatMap((item, index) => (item === before.items[index] ? [] : [index]));
    expect(changed).toEqual([7]);
    expect(handle.getStatus().dirtyFields).toEqual({
      items: Array.from({ length: 50 }, (_, index) => (index === 7 ? { name: true } : undefined)),
    });
  });
});

describe('submitCount', () => {
  const required: RJSFSchema = { type: 'object', required: ['name'], properties: { name: { type: 'string' } } };

  it('counts every submit attempt, valid or not, including FormRef.submit()', async () => {
    const { container, handle, onSubmit, onError } = mountWithHandle({ schema: required, noHtml5Validate: true });
    const button = screen.getByRole('button', { name: 'Submit' });

    await user.click(button);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(handle.getStatus().submitCount).toBe(1);

    await user.type(input(container, 'root_name'), 'x');
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.lastCall?.[0]).toMatchObject({ submitCount: 2, dirty: true, status: 'submitted' });

    act(() => handle.submit());
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(handle.getStatus().submitCount).toBe(3);
  });

  it('rides along on the next onChange', async () => {
    const { container, onChange } = mountWithHandle({ schema: required, noHtml5Validate: true });

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.type(input(container, 'root_name'), 'x');

    expect(lastStatus(onChange)).toEqual({ dirty: true, dirtyFields: { name: true }, submitCount: 1 });
  });
});

describe('reset', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: { name: { type: 'string', minLength: 3 }, city: { type: 'string', default: 'Oslo' } },
  };

  it('makes the data passed the new baseline, clearing errors and submitCount', async () => {
    const { container, handle, onChange } = mountWithHandle({
      schema,
      initialFormData: { name: 'Ada' },
      noHtml5Validate: true,
    });
    await user.clear(input(container, 'root_name'));
    await user.type(input(container, 'root_name'), 'Al');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(fieldErrorsById(container)).not.toEqual({});
    onChange.mockClear();

    act(() => handle.reset({ name: 'Alan' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(handle.getFormData()).toEqual({ name: 'Alan', city: 'Oslo' });
    expect(input(container, 'root_name')).toHaveValue('Alan');
    expect(fieldErrorsById(container)).toEqual({});
    expect(lastStatus(onChange)).toEqual({ dirty: false, dirtyFields: {}, submitCount: 0 });
    expect(handle.getStatus()).toMatchObject(lastStatus(onChange));

    await user.clear(input(container, 'root_name'));
    await user.type(input(container, 'root_name'), 'Ada');
    expect(handle.getStatus()).toMatchObject({ dirty: true, dirtyFields: { name: true }, submitCount: 0 });
  });

  it('returns to the data reset last passed when called with nothing', async () => {
    const { container, handle } = mountWithHandle({ schema, initialFormData: { name: 'Ada' } });
    act(() => handle.reset({ name: 'Alan' }));
    await user.type(input(container, 'root_name'), 'x');

    act(() => handle.reset());

    expect(handle.getFormData()).toEqual({ name: 'Alan', city: 'Oslo' });
    expect(handle.getStatus().dirty).toBe(false);
  });

  it('returns to the props seed when called with nothing, clearing submitCount', async () => {
    const { container, handle, onChange } = mountWithHandle({ schema, initialFormData: { name: 'Ada' } });
    await user.type(input(container, 'root_name'), 'x');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(handle.getStatus()).toMatchObject({ dirty: true, dirtyFields: { name: true }, submitCount: 1 });
    onChange.mockClear();

    act(() => handle.reset());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(handle.getFormData()).toEqual({ name: 'Ada', city: 'Oslo' });
    expect(lastStatus(onChange)).toEqual({ dirty: false, dirtyFields: {}, submitCount: 0 });
  });
});

describe('onChange', () => {
  it('fires no more often than for the edits themselves', async () => {
    const { container, onChange } = mountWithHandle({ schema: person, initialFormData: { name: 'Ada' } });
    const name = input(container, 'root_name');

    await user.type(name, 'abc');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.type(name, '{Backspace}');

    expect(onChange).toHaveBeenCalledTimes(4);
  });
});
