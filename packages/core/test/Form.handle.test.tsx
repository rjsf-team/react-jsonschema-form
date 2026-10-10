import type { RJSFSchema, RJSFValidationError, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormRef, FormProps } from '../src/index.ts';
import Form, { withTheme } from '../src/index.ts';
import { createFormComponent, createFormRef, handleOf } from './testUtils.tsx';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

/** Ref consumers use the existing FormRef contract, independent of Form's component implementation. */
function mountWithHandle(props: Parameters<typeof createFormComponent>[0]) {
  const ref = createFormRef();
  const result = createFormComponent({ ...props, ref });
  const handle: FormRef = handleOf(ref);
  return { ...result, handle };
}

const user = userEvent.setup();

describe('FormRef', () => {
  describe('getFormData()', () => {
    it('returns the seed', () => {
      const { handle } = mountWithHandle({ schema, initialFormData: { name: 'seed' } });

      expect(handle.getFormData()).toEqual({ name: 'seed' });
    });

    it('reflects an edit', async () => {
      const { node, handle } = mountWithHandle({ schema, initialFormData: { name: 'seed' } });

      const input = node.querySelector('input')!;
      await user.clear(input);
      await user.type(input, 'edited');

      expect(handle.getFormData()).toEqual({ name: 'edited' });
    });

    it('returns the formData passed', () => {
      const { handle } = mountWithHandle({ schema, formData: { name: 'parent' }, onChange: () => {} });

      expect(handle.getFormData()).toEqual({ name: 'parent' });
    });

    it('returns undefined when there is neither data nor a default', () => {
      const { handle } = mountWithHandle({ schema: { type: 'string' } });

      expect(handle.getFormData()).toBeUndefined();
    });
  });

  describe('submit()', () => {
    const requiredSchema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };

    it('submits valid data to onSubmit with the submitted status', () => {
      const { handle, onSubmit, onError } = mountWithHandle({ schema: requiredSchema, initialFormData: { name: 'a' } });

      act(() => handle.submit());

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ formData: { name: 'a' }, status: 'submitted' }),
        expect.anything(),
      );
      expect(onError).not.toHaveBeenCalled();
    });

    it('reports invalid data to onError instead', () => {
      // `requestSubmit()` runs the browser's own constraint validation first, so the required input has to be exempt
      // from it for the submit event to reach the form
      const { handle, onSubmit, onError } = mountWithHandle({
        schema: requiredSchema,
        initialFormData: {},
        noHtml5Validate: true,
      });

      act(() => handle.submit());

      expect(onError).toHaveBeenCalledWith([expect.objectContaining({ property: 'name' })]);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits without an onSubmit handler', () => {
      const ref = createFormRef();
      render(<Form ref={ref} schema={requiredSchema} validator={validator} initialFormData={{ name: 'a' }} />);
      const handle: FormRef = handleOf(ref);

      expect(() => act(() => handle.submit())).not.toThrow();
    });

    it('cannot submit when tagName renders something other than a form', () => {
      // Only a `<form>` has `requestSubmit()`; the documented cost of another `tagName` is that native submission is
      // gone, and the programmatic one goes with it
      const { handle, onSubmit } = mountWithHandle({ schema, initialFormData: { name: 'a' }, tagName: 'div' });

      expect(() => act(() => handle.submit())).not.toThrow();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does nothing once the form is unmounted', () => {
      const { handle, unmount, onSubmit } = mountWithHandle({ schema, initialFormData: { name: 'a' } });
      unmount();

      expect(() => handle.submit()).not.toThrow();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('focusOnError()', () => {
    const error = (property?: string) => ({ property, message: 'x', stack: 'x' }) as RJSFValidationError;

    it('focuses the input the error names', () => {
      const { node, handle } = mountWithHandle({ schema });

      act(() => handle.focusOnError(error('.name')));

      expect(node.querySelector('#root_name')).toHaveFocus();
    });

    it('falls back to the first control whose id starts with the field id, for widgets without a named input', () => {
      function ButtonGroup({ id }: WidgetProps) {
        return (
          <>
            <button type='button' id={`${id}-0`} aria-label='a' />
            <button type='button' id={`${id}-1`} aria-label='b' />
          </>
        );
      }
      const { node, handle } = mountWithHandle({
        schema: { type: 'object', properties: { choice: { type: 'string', enum: ['a', 'b'] } } },
        uiSchema: { choice: { 'ui:widget': ButtonGroup } },
      });

      act(() => handle.focusOnError(error('.choice')));

      expect(node.querySelector('#root_choice-0')).toHaveFocus();
    });

    it('treats a missing property as the root field', () => {
      const { node, handle } = mountWithHandle({ schema: { type: 'string' } });

      act(() => handle.focusOnError(error()));

      expect(node.querySelector('#root')).toHaveFocus();
    });

    it('does nothing for a property with no matching element, or once unmounted', () => {
      const { handle, unmount } = mountWithHandle({ schema, tagName: 'div' });

      expect(() => act(() => handle.focusOnError(error('.missing')))).not.toThrow();
      unmount();
      expect(() => handle.focusOnError(error('.name'))).not.toThrow();
    });
  });

  describe('setFieldValue() clearing', () => {
    it('clears an array item to null when addressed by its numeric index', () => {
      const { handle } = mountWithHandle({
        schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'string' } } } },
        initialFormData: { items: ['a', 'b'] },
      });

      act(() => handle.setFieldValue(['items', 0], undefined));

      expect(handle.getFormData()).toEqual({ items: [null, 'b'] });
    });

    it('clears a leaf inside an item of a root array without touching its siblings', () => {
      const { handle } = mountWithHandle({
        schema: {
          type: 'array',
          items: { type: 'object', properties: { name: { type: 'string' }, other: { type: 'string' } } },
        },
        initialFormData: [{ name: 'a', other: 'b' }],
      });

      act(() => handle.setFieldValue([0, 'name'], undefined));

      expect(handle.getFormData()).toEqual([{ other: 'b' }]);
    });
  });

  it('hands back bound members, so destructuring the handle works', () => {
    const { handle } = mountWithHandle({ schema, initialFormData: { name: 'seed' } });
    const { getFormData, validateForm, validate } = handle;

    expect(getFormData()).toEqual({ name: 'seed' });
    expect(validateForm()).toBe(true);
    expect(validate({ name: 'seed' }).errors).toEqual([]);
  });

  it('is reachable through a themed form', () => {
    const ref = createFormRef();
    const ThemedForm = withTheme({});
    render(<ThemedForm ref={ref} schema={schema} validator={validator} initialFormData={{ name: 'themed' }} />);
    const handle: FormRef = handleOf(ref);

    expect(handle.getFormData()).toEqual({ name: 'themed' });
  });

  it('is implemented by function Form and exposes only the supported imperative surface', () => {
    expectTypeOf<FormProps['ref']>().toEqualTypeOf<React.Ref<FormRef> | undefined>();

    expectTypeOf<FormRef>().toHaveProperty('getFormData');
    expectTypeOf<FormRef>().toHaveProperty('submit');
    expectTypeOf<FormRef>().toHaveProperty('reset');
    expectTypeOf<FormRef>().toHaveProperty('setFieldValue');
    expectTypeOf<FormRef>().toHaveProperty('validateForm');
    expectTypeOf<FormRef>().toHaveProperty('validateFormWithFormData');
    expectTypeOf<FormRef>().toHaveProperty('validate');
    expectTypeOf<FormRef>().toHaveProperty('focusOnError');

    expectTypeOf<FormRef>().not.toHaveProperty('state');
    expectTypeOf<FormRef>().not.toHaveProperty('setState');
    expectTypeOf<FormRef>().not.toHaveProperty('componentDidUpdate');
    expectTypeOf<FormRef>().not.toHaveProperty('getSnapshotBeforeUpdate');
  });
});
