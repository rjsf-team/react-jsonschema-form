import type { ErrorSchema, FieldProps, FormValidation, RJSFSchema, RJSFValidationError } from '@rjsf/utils';
import { isPlainObject } from '@rjsf/utils';
import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { FormRef } from '../src/index.ts';
import { SIMPLE_ONEOF } from './testData/layoutData.ts';
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

  it('follows an item blurred while empty past an item removed before it', async () => {
    const { container, handle } = mountWithHandle({
      schema: list,
      initialFormData: { items: [{ name: 'a' }, { name: 'b' }, {}] },
    });

    await blur(container, 'root_items_2_name');
    await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-remove')[1]);

    expect(handle.getFormData()).toEqual({ items: [{ name: 'a' }, {}] });
    expect(handle.getStatus().touchedFields).toEqual({ items: [undefined, { name: true }] });
  });

  it('holds an entry for each item of a root array', async () => {
    const { container, handle } = mountWithHandle({
      schema: { type: 'array', items: { type: 'string' } },
      initialFormData: ['a', 'b', 'c', 'd'],
    });

    await blur(container, 'root_2');

    const { touchedFields } = handle.getStatus();
    expect(touchedFields).toEqual([undefined, undefined, true, undefined]);
    expect(Array.isArray(touchedFields) && Object.keys(touchedFields)).toEqual(['0', '1', '2', '3']);
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

const petSchema: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    pet: {
      type: 'object',
      oneOf: [
        {
          title: 'cat',
          required: ['meow'],
          properties: { meow: { type: 'string', minLength: 3 }, lives: { type: 'string' } },
        },
        { title: 'dog', properties: { bark: { type: 'string' } } },
      ],
    },
  },
};

describe('a blur that is not a field', () => {
  it("touches nothing and reveals none of the fields' errors for an option selector", async () => {
    const { container, node, handle } = mountWithHandle({
      schema: petSchema,
      initialFormData: { name: 'x', pet: { meow: 'a', lives: 'b' } },
      liveValidate: 'onBlur',
      liveErrors: 'field',
    });

    await user.click(elementOf(container, '#root_pet__oneof_select'));
    await user.click(document.body);

    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
    expect(fieldErrorsById(node)).toEqual({});
  });

  it("touches nothing and reveals none of the fields' errors for a root option selector", async () => {
    const { container, node, handle } = mountWithHandle({
      schema: {
        oneOf: [
          {
            title: 'cat',
            type: 'object',
            required: ['meow'],
            properties: { meow: { type: 'string', minLength: 3 }, lives: { type: 'string' } },
          },
          { title: 'dog', type: 'object', properties: { bark: { type: 'string' } } },
        ],
      },
      initialFormData: { meow: 'a', lives: 'b' },
      liveValidate: 'onBlur',
      liveErrors: 'field',
    });

    await user.click(elementOf(container, '#root__oneof_select'));
    await user.click(document.body);

    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
    expect(fieldErrorsById(node)).toEqual({});
  });
  it('touches nothing for the type selector of a field the fallback UI renders', async () => {
    const { container, handle } = mountWithHandle({
      schema: { type: 'object', properties: { x: { type: ['number', 'string'] } } },
      useFallbackUiForUnsupportedType: true,
    });

    await user.click(elementOf(container, '#root_x__internalTypeSelector'));
    await user.click(document.body);

    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
  });
});

describe('an option switch', () => {
  it('keeps the touched and revealed field whose value both options hold', async () => {
    const { container, node, handle } = mountWithHandle({
      schema: {
        type: 'object',
        oneOf: [
          { title: 'A', properties: { email: { type: 'string', minLength: 5 }, a: { type: 'string', minLength: 5 } } },
          { title: 'B', properties: { email: { type: 'string', minLength: 5 }, b: { type: 'string', minLength: 5 } } },
        ],
      },
      initialFormData: { email: 'x@y', a: 'x', b: 'x' },
      liveValidate: 'onBlur',
      liveErrors: 'field',
    });

    await blur(container, 'root_email');
    await user.selectOptions(elementOf(container, '#root__oneof_select'), 'B');

    expect(handle.getStatus()).toMatchObject({ touched: true, touchedFields: { email: true } });
    // The switch reveals the object's own errors, but not those of `b`, which nothing reached
    expect(fieldErrorsById(node)).toHaveProperty('root_email');
    expect(fieldErrorsById(node)).not.toHaveProperty('root_b');
  });
});

describe("a layout grid's discriminated cell", () => {
  it('touches the selector field its widget writes', async () => {
    const { node, handle } = mountWithHandle({
      schema: {
        type: 'object',
        properties: { note: { type: 'string' }, pick: SIMPLE_ONEOF },
      },
      uiSchema: { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['note', 'pick'] }] } },
      initialFormData: { pick: { answer: '1' } },
      liveValidate: 'onBlur',
      liveErrors: 'field',
    });

    await user.click(screen.getByRole('radio', { name: 'Choice 1' }));
    await user.click(document.body);

    expect(handle.getStatus()).toEqual({
      dirty: false,
      dirtyFields: {},
      touched: true,
      touchedFields: { pick: { answer: true } },
      submitCount: 0,
    });
    expect(Object.keys(fieldErrorsById(node))).toEqual(['root_pick']);
  });
});

describe('a key setFieldValue() drops', () => {
  it('is no longer touched or revealed, and is not again once the key comes back', async () => {
    const { container, node, handle } = mountWithHandle({
      schema: { type: 'object', additionalProperties: { type: 'string', minLength: 3 } },
      initialFormData: { foo: 'a', bar: 'b' },
      liveValidate: 'onBlur',
      liveErrors: 'field',
    });
    await blur(container, 'root_foo');
    expect(handle.getStatus().touchedFields).toEqual({ foo: true });

    act(() => handle.setFieldValue([], { bar: 'b' }));
    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
    act(() => handle.setFieldValue([], { bar: 'b', foo: 'z' }));
    await blur(container, 'root_bar');

    expect(handle.getStatus().touchedFields).toEqual({ bar: true });
    expect(Object.keys(fieldErrorsById(node))).toEqual(['root_bar']);
  });
});

describe('a field with no value', () => {
  it('marks nothing for a whole-array widget', async () => {
    const { handle } = mountWithHandle({
      schema: checkboxGroup,
      uiSchema: { tags: { 'ui:widget': 'checkboxes' } },
    });
    expect(handle.getFormData()).toEqual({});

    await user.tab();
    await user.click(document.body);

    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
  });

  it('marks a text field', async () => {
    const { container, handle } = mountWithHandle({
      schema: { type: 'object', properties: { text: { type: 'string' } } },
    });

    await blur(container, 'root_text');

    expect(handle.getStatus()).toMatchObject({ touched: true, touchedFields: { text: true } });
  });

  it("reveals a whole-array widget's errors, though minItems has nothing to check", async () => {
    const { node, handle } = mountWithHandle({
      schema: {
        type: 'object',
        properties: {
          tags: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string', enum: ['a', 'b'] } },
        },
      },
      uiSchema: { tags: { 'ui:widget': 'checkboxes' } },
      liveValidate: 'onBlur',
      liveErrors: 'field',
    });

    await user.tab();
    await user.click(document.body);

    expect(handle.getFormData()).toEqual({});
    expect(fieldErrorsById(node)).toEqual({});
    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
  });
});

describe('a change transformChange rewrites', () => {
  function toSortedItems(items: unknown): string[] {
    return Array.isArray(items) ? items.filter((item) => typeof item === 'string').toSorted() : [];
  }

  it('leaves the touched item where the rewrite put it back', async () => {
    const { container, handle } = mountWithHandle({
      schema: {
        type: 'object',
        properties: { count: { type: 'number' }, items: { type: 'array', items: { type: 'string' } } },
      },
      initialFormData: { items: ['a', 'b', 'c'] },
      // Sorts the items back, and counts the edit so the rewrite is not the data before it
      transformChange: (next) =>
        isPlainObject(next)
          ? { count: typeof next.count === 'number' ? next.count + 1 : 1, items: toSortedItems(next.items) }
          : next,
    });

    await blur(container, 'root_items_0');
    await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[0]);

    expect(handle.getFormData()).toEqual({ count: 1, items: ['a', 'b', 'c'] });
    expect(handle.getStatus().touchedFields).toEqual({ items: [true, undefined, undefined] });
  });

  it("reveals only the array's own errors for an add under liveErrors 'field'", async () => {
    const { container, node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          count: { type: 'number' },
          tags: { type: 'array', minItems: 3, items: { type: 'string', minLength: 2 } },
        },
      },
      liveValidate: 'onChange',
      liveErrors: 'field',
      initialFormData: { tags: ['a'] },
      transformChange: (next) =>
        isPlainObject(next) ? { ...next, count: Array.isArray(next.tags) ? next.tags.length : 0 } : next,
    });

    await user.click(elementOf(container, '.rjsf-array-item-add button'));

    expect(Object.keys(fieldErrorsById(node))).toEqual(['root_tags']);
  });
});

describe('an added property', () => {
  it("reveals only the object's own errors under liveErrors 'field'", async () => {
    const { container, node } = createFormComponent({
      schema: {
        type: 'object',
        minProperties: 3,
        properties: { name: { type: 'string', minLength: 3 } },
        additionalProperties: { type: 'string' },
      },
      liveValidate: 'onChange',
      liveErrors: 'field',
      initialFormData: { name: 'x' },
    });

    await user.click(elementOf(container, '.rjsf-object-property-expand button'));

    expect(Object.keys(fieldErrorsById(node))).toEqual(['root']);
  });
});

describe('a whole-array widget blurred while it held nothing', () => {
  it('stays untouched once data fills it without another blur', async () => {
    const { handle } = mountWithHandle({
      schema: checkboxGroup,
      uiSchema: { tags: { 'ui:widget': 'checkboxes' } },
      initialFormData: { tags: [] },
    });
    await user.tab();
    await user.click(document.body);

    act(() => handle.setFieldValue('tags', ['a']));

    expect(handle.getStatus().touched).toBe(false);
    expect(handle.getStatus().touchedFields).toEqual({});
  });
});

describe('a blur onBlur causes', () => {
  it('touches the field that reported it', async () => {
    const onBlur = (id: string) => {
      if (id === 'root_name') {
        const other = document.getElementById('root_address_city');
        other?.focus();
        other?.blur();
      }
    };
    const { container, handle } = mountWithHandle({ schema: person, onBlur });

    await blur(container, 'root_name');

    expect(handle.getStatus().touchedFields).toEqual({ name: true, address: { city: true } });
  });
});

describe('a key omitExtraData drops', () => {
  /** Blurs the checkbox `a`, the first field, which a click would toggle */
  async function blurWithoutClick() {
    await user.click(document.body);
    await user.tab();
    await user.click(document.body);
  }

  const branched: RJSFSchema = {
    type: 'object',
    properties: { a: { type: 'boolean' } },
    if: { properties: { a: { const: true } }, required: ['a'] },
    then: { properties: { b: { type: 'string', minLength: 3 } } },
  };

  it("is no longer touched or revealed once liveOmit 'onBlur' drops it", async () => {
    const { container, node, handle } = mountWithHandle({
      schema: branched,
      initialFormData: { a: true, b: 'x' },
      omitExtraData: true,
      liveOmit: 'onBlur',
      liveValidate: 'onBlur',
      liveErrors: 'field',
    });
    await blur(container, 'root_b');
    expect(Object.keys(fieldErrorsById(node))).toEqual(['root_b']);
    // A write at the root is taken as written, so the key the branch no longer describes stays until the omission
    act(() => handle.setFieldValue('', { a: false, b: 'x' }));

    await blurWithoutClick();

    expect(handle.getFormData()).toEqual({ a: false });
    expect(handle.getStatus()).toMatchObject({ touched: true, touchedFields: { a: true } });
    act(() => handle.setFieldValue('', { a: true, b: 'x' }));
    await blurWithoutClick();
    expect(handle.getStatus().touchedFields).toEqual({ a: true });
    expect(fieldErrorsById(node)).toEqual({});
  });

  it('is no longer touched once a submit drops it', async () => {
    const { container, node, handle } = mountWithHandle({
      schema: branched,
      initialFormData: { a: true, b: 'xyz' },
      omitExtraData: true,
    });
    await blur(container, 'root_b');
    act(() => handle.setFieldValue('', { a: false, b: 'xyz' }));

    await submitForm(node, user, true);

    expect(handle.getFormData()).toEqual({ a: false });
    expect(handle.getStatus()).toMatchObject({ touched: false, touchedFields: {} });
  });
});

describe('a schema prop change that drops a revealed key', () => {
  it('shows none of its errors', async () => {
    const props = {
      schema: {
        type: 'object',
        properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', minLength: 3 } },
      },
      initialFormData: { a: 'x', b: 'y' },
      liveValidate: 'onChange',
      liveErrors: 'field',
    } satisfies Parameters<typeof createFormComponent>[0];
    const { container, node, handle, rerender } = mountWithHandle(props);
    await user.type(input(container, 'root_b'), 'z');
    expect(Object.keys(fieldErrorsById(node))).toEqual(['root_b']);

    rerender({
      ...props,
      schema: { type: 'object', properties: { a: { type: 'string', minLength: 3 } }, required: ['b'] },
      ref: createFormRef(),
    });

    expect(handle.getFormData()).toEqual({ a: 'x' });
    expect(errorListMessages(node)).toEqual([]);
  });
});

describe('a move transformChange rewrites back under liveErrors field', () => {
  it('shows the errors of the item the edit revealed', async () => {
    const { container, node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        properties: { count: { type: 'number' }, items: { type: 'array', items: { type: 'string', maxLength: 1 } } },
      },
      initialFormData: { items: ['a', 'b', 'c'] },
      liveValidate: 'onChange',
      liveErrors: 'field',
      transformChange: (next) =>
        isPlainObject(next)
          ? {
              count: typeof next.count === 'number' ? next.count + 1 : 1,
              items: Array.isArray(next.items) ? next.items.filter((item) => typeof item === 'string').toSorted() : [],
            }
          : next,
    });
    await user.type(input(container, 'root_items_0'), 'x');
    expect(Object.keys(fieldErrorsById(node))).toEqual(['root_items_0']);

    await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[0]);

    expect(lastEvent(onChange).errorProperties).toEqual(['.items.0']);
    expect(Object.keys(fieldErrorsById(node))).toEqual(['root_items_0']);
    expect(errorListMessages(node)).toHaveLength(1);
  });
});

describe('a blur a parent field causes before it sends its own', () => {
  it('touches each field its own blur reached', async () => {
    function MovingFocusObjectField(props: FieldProps) {
      const { ObjectField } = props.registry.fields;
      const { onBlur } = props;
      return (
        <ObjectField
          {...props}
          onBlur={(id, value) => {
            if (id === 'root_name') {
              const other = document.getElementById('root_address_city');
              other?.focus();
              other?.blur();
            }
            onBlur(id, value);
          }}
        />
      );
    }
    const { container, handle } = mountWithHandle({ schema: person, uiSchema: { 'ui:field': MovingFocusObjectField } });

    await blur(container, 'root_name');

    expect(handle.getStatus().touchedFields).toEqual({ name: true, address: { city: true } });
  });
});
