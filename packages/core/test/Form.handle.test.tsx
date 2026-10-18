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

/** A container in the document of an iframe, whose window has classes of its own, the way a form is rendered by a
 * portal into a frame
 */
function frameContainer() {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  onTestFinished(() => frame.remove());
  const frameDocument = frame.contentDocument;
  if (!frameDocument) {
    throw new Error('The iframe has no document');
  }
  return frameDocument.body.appendChild(frameDocument.createElement('div'));
}

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
      const { handle } = mountWithHandle({ schema, initialFormData: { name: 'parent' }, onChange: () => {} });

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

    it.each<[string, FormProps['tagName']]>([
      ['a form', undefined],
      ['an element other than a form', 'div'],
    ])('throws an error from onSubmit out of submit() for %s, as the other handle methods do', (_, tagName) => {
      const { handle } = mountWithHandle({
        schema,
        initialFormData: { name: 'a' },
        tagName,
        onSubmit: () => {
          throw new Error('from onSubmit');
        },
      });

      expect(() => act(() => handle.submit())).toThrow('from onSubmit');
    });

    it('throws an error from onError out of submit()', () => {
      const { handle } = mountWithHandle({
        schema: requiredSchema,
        initialFormData: {},
        noHtml5Validate: true,
        onError: () => {
          throw new Error('from onError');
        },
      });

      expect(() => act(() => handle.submit())).toThrow('from onError');
    });

    it('throws an error from customValidate out of submit()', () => {
      const { handle, onSubmit } = mountWithHandle({
        schema,
        initialFormData: { name: 'a' },
        customValidate: () => {
          throw new Error('from customValidate');
        },
      });

      expect(() => act(() => handle.submit())).toThrow('from customValidate');
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits through a dispatched submit event when tagName renders something other than a form', () => {
      // Only a `<form>` has `requestSubmit()`, so the element gets the submit event the form's handler takes instead
      const { handle, onSubmit } = mountWithHandle({ schema, initialFormData: { name: 'a' }, tagName: 'div' });

      act(() => handle.submit());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.lastCall?.[0].formData).toEqual({ name: 'a' });
    });

    it('keeps the submit event it dispatches to an element other than a form from an enclosing form', () => {
      const ref = createFormRef();
      const onSubmit = vi.fn();
      const outerSubmit = vi.fn();
      render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            outerSubmit();
          }}
        >
          <Form
            ref={ref}
            schema={schema}
            validator={validator}
            initialFormData={{ name: 'a' }}
            tagName='div'
            onSubmit={onSubmit}
          />
        </form>,
      );

      act(() => handleOf(ref).submit());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(outerSubmit).not.toHaveBeenCalled();
    });

    it('does nothing once the form is unmounted', () => {
      const { handle, unmount, onSubmit } = mountWithHandle({ schema, initialFormData: { name: 'a' } });
      unmount();

      expect(() => handle.submit()).not.toThrow();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits a form rendered into the document of an iframe', () => {
      const ref = createFormRef();
      const onSubmit = vi.fn();
      render(
        <Form ref={ref} schema={schema} validator={validator} initialFormData={{ name: 'a' }} onSubmit={onSubmit} />,
        { container: frameContainer() },
      );

      act(() => handleOf(ref).submit());

      expect(onSubmit).toHaveBeenCalledTimes(1);
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

    it.each(['say "hi"', 'back\\slash', 'line\nbreak'])(
      'falls back to the first control whose id starts with a field id holding a character a selector quotes: %j',
      (name) => {
        function ButtonGroup({ id }: WidgetProps) {
          return (
            <>
              <button type='button' id={`${id}-0`} aria-label='a' />
              <button type='button' id={`${id}-1`} aria-label='b' />
            </>
          );
        }
        const { node, handle } = mountWithHandle({
          schema: { type: 'object', properties: { [name]: { type: 'string', enum: ['a', 'b'] } } },
          uiSchema: { [name]: { 'ui:widget': ButtonGroup } },
        });

        act(() => handle.focusOnError(error(`.${name}`)));

        expect(node.ownerDocument.activeElement).toBe(node.ownerDocument.getElementById(`root_${name}-0`));
      },
    );

    it('focuses the input of a form rendered into the document of an iframe', () => {
      const ref = createFormRef();
      const container = frameContainer();
      render(<Form ref={ref} schema={schema} validator={validator} />, { container });

      act(() => handleOf(ref).focusOnError(error('.name')));

      expect(container.ownerDocument.activeElement).toBe(container.querySelector('#root_name'));
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
