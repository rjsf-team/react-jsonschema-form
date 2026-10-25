import type { ErrorSchema, FormValidation, RJSFSchema, RJSFValidationError } from '@rjsf/utils';
import { act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { FormRef } from '../src/index.ts';
import {
  createFormComponent,
  createFormRef,
  elementOf,
  errorListMessages,
  fieldErrorsById,
  handleOf,
  input,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

function mountWithHandle(props: Parameters<typeof createFormComponent>[0]) {
  const ref = createFormRef();
  const result = createFormComponent({ ...props, ref });
  const handle: FormRef = handleOf(ref);
  return { ...result, handle };
}

/** The last event `onChange` was called with */
function lastEvent(onChange: Mock) {
  const event: unknown = onChange.mock.lastCall?.[0];
  if (typeof event !== 'object' || event === null) {
    throw new Error('onChange has not been called');
  }
  const errors: unknown = Reflect.get(event, 'errors');
  const errorSchema: unknown = Reflect.get(event, 'errorSchema');
  return {
    touched: Reflect.get(event, 'touched'),
    touchedFields: Reflect.get(event, 'touchedFields'),
    errorProperties: Array.isArray(errors) ? errors.map((error: RJSFValidationError) => error.property) : [],
    errorSchemaKeys: typeof errorSchema === 'object' && errorSchema !== null ? Object.keys(errorSchema) : [],
  };
}

/** The properties the errors `onError` was last called with belong to */
function propertiesOfOnError(onError: Mock): string[] {
  const errors: RJSFValidationError[] = onError.mock.lastCall?.[0] ?? [];
  return errors.map((error) => error.property ?? '').sort();
}

async function blur(container: HTMLElement, id: string) {
  await user.click(input(container, id));
  await user.click(document.body);
}

/** Submits through a submit event rather than the button, since clicking the button would first blur the focused field,
 * which the test means to leave unblurred
 */
async function submitWithoutBlur(node: Element) {
  await submitForm(node, user, true);
}

const person: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: { type: 'object', properties: { street: { type: 'string' }, city: { type: 'string' } } },
  },
};

const list: RJSFSchema = {
  type: 'object',
  properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } } },
};

const listData = { items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] };

const checkboxGroup: RJSFSchema = {
  type: 'object',
  properties: {
    tags: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['a', 'b'] } },
  },
};

describe('touched', () => {
  it('starts untouched', () => {
    const { handle } = mountWithHandle({ schema: person });

    expect(handle.getStatus()).toEqual({
      dirty: false,
      dirtyFields: {},
      touched: false,
      touchedFields: {},
      submitCount: 0,
    });
  });

  it('marks a blurred nested field, without an onChange of its own', async () => {
    const onBlur = vi.fn();
    const { container, handle, onChange } = mountWithHandle({ schema: person, onBlur });

    await blur(container, 'root_address_street');

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(handle.getStatus()).toMatchObject({ touched: true, touchedFields: { address: { street: true } } });
  });

  it('marks a blurred array item', async () => {
    const { container, handle } = mountWithHandle({ schema: list, initialFormData: listData });

    await blur(container, 'root_items_1_name');

    expect(handle.getStatus().touchedFields).toEqual({ items: [undefined, { name: true }, undefined] });
  });

  it('rides along on the next onChange', async () => {
    const { container, onChange } = mountWithHandle({ schema: person });

    await blur(container, 'root_name');
    expect(onChange).not.toHaveBeenCalled();
    await user.type(input(container, 'root_address_city'), 'x');

    expect(lastEvent(onChange)).toMatchObject({ touched: true, touchedFields: { name: true } });
  });

  it('is not marked by a submit', async () => {
    const { node, handle, onSubmit } = mountWithHandle({ schema: person });

    await submitForm(node, user);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {}, submitCount: 1 });
  });

  it('follows an item removed before it', async () => {
    const { container, handle } = mountWithHandle({ schema: list, initialFormData: listData });

    await blur(container, 'root_items_2_name');
    await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-remove')[0]);

    expect(handle.getFormData()).toEqual({ items: [{ name: 'b' }, { name: 'c' }] });
    expect(handle.getStatus().touchedFields).toEqual({ items: [undefined, { name: true }] });
  });

  it('is dropped with its removed item', async () => {
    const { container, handle } = mountWithHandle({ schema: list, initialFormData: listData });

    await blur(container, 'root_items_0_name');
    await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-remove')[0]);

    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
  });

  it('follows a reordered item', async () => {
    const { container, handle } = mountWithHandle({ schema: list, initialFormData: listData });

    await blur(container, 'root_items_0_name');
    await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[0]);

    expect(handle.getFormData()).toEqual({ items: [{ name: 'b' }, { name: 'a' }, { name: 'c' }] });
    expect(handle.getStatus().touchedFields).toEqual({ items: [undefined, { name: true }, undefined] });
  });

  it('marks each item a widget that handles a whole array holds', async () => {
    const { container, handle } = mountWithHandle({
      schema: checkboxGroup,
      uiSchema: { tags: { 'ui:widget': 'checkboxes' } },
      initialFormData: { tags: [] },
    });
    const [first] = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

    await user.click(first);
    await user.click(document.body);

    expect(handle.getFormData()).toEqual({ tags: ['a'] });
    expect(handle.getStatus()).toMatchObject({ touched: true, touchedFields: { tags: [true] } });
  });

  it('marks nothing for a widget that handles a whole array holding no items', async () => {
    const { container, handle } = mountWithHandle({
      schema: checkboxGroup,
      uiSchema: { tags: { 'ui:widget': 'checkboxes' } },
      initialFormData: { tags: [] },
    });
    const [first] = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

    await user.click(first);
    await user.click(first);
    await user.click(document.body);

    expect(handle.getFormData()).toEqual({ tags: [] });
    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
  });

  it('is untouched again once setFieldValue() removes the touched item', async () => {
    const { container, handle } = mountWithHandle({ schema: list, initialFormData: listData });
    await blur(container, 'root_items_2_name');

    act(() => handle.setFieldValue('items', [{ name: 'a' }]));

    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
  });

  it('is cleared by reset()', async () => {
    const { container, handle, onChange } = mountWithHandle({ schema: person });
    await blur(container, 'root_name');

    act(() => handle.reset());

    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
    expect(lastEvent(onChange)).toMatchObject({ touched: false, touchedFields: {} });
  });
});

const pair: RJSFSchema = {
  type: 'object',
  required: ['a', 'b'],
  properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', minLength: 3 } },
};

describe('liveErrors', () => {
  describe("'field' under liveValidate 'onChange'", () => {
    it("shows only the changed field's errors, on screen and in onChange", async () => {
      const { container, node, onChange } = createFormComponent({
        schema: pair,
        liveValidate: 'onChange',
        liveErrors: 'field',
      });

      await user.type(input(container, 'root_a'), 'x');

      expect(Object.keys(fieldErrorsById(node))).toEqual(['root_a']);
      expect(errorListMessages(node)).toEqual(['.a must NOT have fewer than 3 characters']);
      const { errorProperties, errorSchemaKeys } = lastEvent(onChange);
      expect(errorProperties).toEqual(['.a']);
      expect(errorSchemaKeys).toEqual(['a']);
    });

    it("reveals a field's errors once it changes", async () => {
      const { container, node } = createFormComponent({ schema: pair, liveValidate: 'onChange', liveErrors: 'field' });

      await user.type(input(container, 'root_a'), 'x');
      await user.type(input(container, 'root_b'), 'y');

      expect(Object.keys(fieldErrorsById(node)).sort()).toEqual(['root_a', 'root_b']);
    });

    it('reveals every error after a submit, and keeps them revealed', async () => {
      const { container, node, onError } = createFormComponent({
        schema: pair,
        liveValidate: 'onChange',
        liveErrors: 'field',
      });
      await user.type(input(container, 'root_a'), 'x');

      await submitWithoutBlur(node);
      expect(propertiesOfOnError(onError)).toEqual(['.a', 'b']);
      expect(Object.keys(fieldErrorsById(node)).sort()).toEqual(['root_a', 'root_b']);
      await user.type(input(container, 'root_a'), 'x');

      expect(Object.keys(fieldErrorsById(node)).sort()).toEqual(['root_a', 'root_b']);
    });

    it('always shows extraErrors', async () => {
      const extraErrors: ErrorSchema = { b: { __errors: ['taken'] } };
      const { container, node } = createFormComponent({
        schema: pair,
        liveValidate: 'onChange',
        liveErrors: 'field',
        extraErrors,
      });

      expect(fieldErrorsById(node)).toEqual({ root_b: ['taken'] });
      await user.type(input(container, 'root_a'), 'x');

      expect(fieldErrorsById(node)).toEqual({
        root_a: ['must NOT have fewer than 3 characters'],
        root_b: ['taken'],
      });
    });

    it('reveals customValidate errors as it reveals the schema errors', async () => {
      const { container, node } = createFormComponent({
        schema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } },
        liveValidate: 'onChange',
        liveErrors: 'field',
        customValidate: (_formData, errors: FormValidation<{ a?: string; b?: string }>) => {
          errors.a?.addError('custom a');
          errors.b?.addError('custom b');
          return errors;
        },
      });

      await user.type(input(container, 'root_a'), 'x');

      expect(fieldErrorsById(node)).toEqual({ root_a: ['custom a'] });
    });

    it('reveals every error through validateForm(), until reset(), without counting a submit', async () => {
      const { container, node, handle, onError } = mountWithHandle({
        schema: pair,
        liveValidate: 'onChange',
        liveErrors: 'field',
      });
      await user.type(input(container, 'root_a'), 'x');

      let isValid = true;
      act(() => {
        isValid = handle.validateForm();
      });

      expect(isValid).toBe(false);
      expect(propertiesOfOnError(onError)).toEqual(['.a', 'b']);
      expect(Object.keys(fieldErrorsById(node)).sort()).toEqual(['root_a', 'root_b']);
      expect(handle.getStatus().submitCount).toBe(0);
      await user.type(input(container, 'root_a'), 'x');
      expect(Object.keys(fieldErrorsById(node)).sort()).toEqual(['root_a', 'root_b']);

      act(() => handle.reset());
      await user.type(input(container, 'root_a'), 'x');

      expect(Object.keys(fieldErrorsById(node))).toEqual(['root_a']);
    });

    it("reveals an array's own errors once an item is added or removed", async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          tags: { type: 'array', minItems: 3, items: { type: 'string' } },
          other: { type: 'string', minLength: 3 },
        },
      };
      const added = createFormComponent({
        schema,
        liveValidate: 'onChange',
        liveErrors: 'field',
        initialFormData: { tags: ['a'], other: 'x' },
      });
      await user.type(input(added.container, 'root_other'), 'yz');
      expect(Object.keys(fieldErrorsById(added.node))).toEqual([]);
      await user.click(elementOf(added.container, '.rjsf-array-item-add button'));
      expect(Object.keys(fieldErrorsById(added.node))).toEqual(['root_tags']);
      added.unmount();

      const removed = createFormComponent({
        schema,
        liveValidate: 'onChange',
        liveErrors: 'field',
        initialFormData: { tags: ['a', 'b', 'c'], other: 'x' },
      });
      await user.click(removed.container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-remove')[0]);

      expect(Object.keys(fieldErrorsById(removed.node))).toEqual(['root_tags']);
    });

    it("reveals an object's own errors once a field inside it changes", async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            minProperties: 2,
            properties: { street: { type: 'string' }, city: { type: 'string' } },
          },
          other: { type: 'string', minLength: 3 },
        },
      };
      const { container, node } = createFormComponent({
        schema,
        liveValidate: 'onChange',
        liveErrors: 'field',
        initialFormData: { other: 'x' },
      });

      await user.type(input(container, 'root_address_street'), 's');

      expect(Object.keys(fieldErrorsById(node))).toEqual(['root_address']);
    });

    it('hides the errors again after reset()', async () => {
      const { container, node, handle } = mountWithHandle({
        schema: pair,
        liveValidate: 'onChange',
        liveErrors: 'field',
      });
      await user.type(input(container, 'root_a'), 'x');
      await submitWithoutBlur(node);

      act(() => handle.reset());
      expect(fieldErrorsById(node)).toEqual({});
      await user.type(input(container, 'root_a'), 'x');

      expect(Object.keys(fieldErrorsById(node))).toEqual(['root_a']);
    });
  });

  describe("'field' under liveValidate 'onBlur'", () => {
    it("reveals a field's errors once it is blurred", async () => {
      const { container, node } = createFormComponent({ schema: pair, liveValidate: 'onBlur', liveErrors: 'field' });

      await user.type(input(container, 'root_a'), 'x');
      expect(fieldErrorsById(node)).toEqual({});
      await user.click(document.body);
      expect(Object.keys(fieldErrorsById(node))).toEqual(['root_a']);
      await blur(container, 'root_b');

      expect(Object.keys(fieldErrorsById(node)).sort()).toEqual(['root_a', 'root_b']);
    });

    it('reveals the errors of an empty checkbox group once it is blurred, though that touches nothing', async () => {
      const { node, handle } = mountWithHandle({
        schema: {
          type: 'object',
          properties: {
            tags: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string', enum: ['a', 'b'] } },
            other: { type: 'string', minLength: 3 },
          },
        },
        uiSchema: { tags: { 'ui:widget': 'checkboxes' } },
        initialFormData: { tags: [], other: 'x' },
        liveValidate: 'onBlur',
        liveErrors: 'field',
      });

      await user.tab();
      await user.tab();
      await user.click(document.body);

      expect(Object.keys(fieldErrorsById(node))).toEqual(['root_tags']);
      expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
    });
  });

  it("shows every error with the default 'all'", async () => {
    const { container, node } = createFormComponent({ schema: pair, liveValidate: 'onChange' });

    await user.type(input(container, 'root_a'), 'x');

    expect(Object.keys(fieldErrorsById(node)).sort()).toEqual(['root_a', 'root_b']);
  });

  it('changes nothing without liveValidate', async () => {
    const { container, node } = createFormComponent({ schema: pair, liveErrors: 'field' });

    await user.type(input(container, 'root_a'), 'x');
    expect(fieldErrorsById(node)).toEqual({});
    await submitWithoutBlur(node);

    expect(Object.keys(fieldErrorsById(node)).sort()).toEqual(['root_a', 'root_b']);
  });
});
