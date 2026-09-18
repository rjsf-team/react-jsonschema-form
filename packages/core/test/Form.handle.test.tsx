import { createRef } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render } from '@testing-library/react';
import { expectTypeOf } from 'vitest';

import type { FormHandle } from '../src/index.ts';
import type Form from '../src/index.ts';
import { withTheme } from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

/** The supported pattern: the ref is typed as the class because TSX types a class element's `ref` by its instance,
 * and consuming code narrows to the handle so nothing outside it is relied upon.
 */
function mountWithHandle(props: Parameters<typeof createFormComponent>[0]) {
  const ref = createRef<Form>();
  const result = createFormComponent({ ...props, ref });
  const handle: FormHandle = ref.current!;
  return { ...result, handle };
}

describe('FormHandle', () => {
  describe('getFormData()', () => {
    it('returns the seed of an uncontrolled form', () => {
      const { handle } = mountWithHandle({ schema, initialFormData: { name: 'seed' } });

      expect(handle.getFormData()).toEqual({ name: 'seed' });
    });

    it('reflects an edit committed by an uncontrolled form', () => {
      const { node, handle } = mountWithHandle({ schema, initialFormData: { name: 'seed' } });

      fireEvent.change(node.querySelector('input')!, { target: { value: 'edited' } });

      expect(handle.getFormData()).toEqual({ name: 'edited' });
    });

    it('returns the rendered value of a controlled form', () => {
      const { handle } = mountWithHandle({ schema, formData: { name: 'parent' }, onChange: () => {} });

      expect(handle.getFormData()).toEqual({ name: 'parent' });
    });

    it('returns undefined when there is neither data nor a default', () => {
      const { handle } = mountWithHandle({ schema: { type: 'string' } });

      expect(handle.getFormData()).toBeUndefined();
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
    const ref = createRef<Form>();
    const ThemedForm = withTheme({});
    render(<ThemedForm ref={ref} schema={schema} validator={validator} initialFormData={{ name: 'themed' }} />);
    const handle: FormHandle = ref.current!;

    expect(handle.getFormData()).toEqual({ name: 'themed' });
  });

  it('is implemented by the Form class and exposes only the supported imperative surface', () => {
    expectTypeOf<Form>().toExtend<FormHandle>();

    expectTypeOf<FormHandle>().toHaveProperty('getFormData');
    expectTypeOf<FormHandle>().toHaveProperty('submit');
    expectTypeOf<FormHandle>().toHaveProperty('reset');
    expectTypeOf<FormHandle>().toHaveProperty('setFieldValue');
    expectTypeOf<FormHandle>().toHaveProperty('validateForm');
    expectTypeOf<FormHandle>().toHaveProperty('validateFormWithFormData');
    expectTypeOf<FormHandle>().toHaveProperty('validate');
    expectTypeOf<FormHandle>().toHaveProperty('focusOnError');

    expectTypeOf<FormHandle>().not.toHaveProperty('state');
    expectTypeOf<FormHandle>().not.toHaveProperty('setState');
    expectTypeOf<FormHandle>().not.toHaveProperty('componentDidUpdate');
    expectTypeOf<FormHandle>().not.toHaveProperty('getSnapshotBeforeUpdate');
  });
});
