import { createRef } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { act } from '@testing-library/react';

import type Form from '../src/index.ts';
import { createFormComponent, errorListMessages } from './testUtils.tsx';

/** Deriving state from the props honors every input that changed, whether or not the reconciler's identity-prop
 * gate lists it. Reference retention across a derivation is `renderStability.test.tsx`'s job.
 */
describe('state derivation', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      a: { type: 'string', default: 'x' },
      b: { type: 'string' },
    },
  };

  it('a replaced customValidate takes effect on the next change', async () => {
    const formRef = createRef<Form>();
    const { node, rerender } = createFormComponent({
      ref: formRef,
      schema,
      initialFormData: { b: 'y' },
      liveValidate: 'onChange',
    });
    await act(async () => {
      formRef.current!.setFieldValue('b', 'z');
    });
    expect(node.querySelectorAll('.error-detail li')).toHaveLength(0);

    rerender({
      ref: formRef,
      schema,
      initialFormData: { b: 'y' },
      liveValidate: 'onChange',
      customValidate: (_data, errors) => {
        errors.b?.addError('custom');
        return errors;
      },
    });
    await act(async () => {
      formRef.current!.setFieldValue('b', 'z');
    });

    expect(node.querySelector('.error-detail')).toHaveTextContent('custom');
  });

  it('a parent-driven data change validates with the schema resolved for the data, as an edit does', () => {
    // The resolved schema has had the root's `then` folded into it: its constraints are reported where they apply and
    // the `then` miss itself is not, exactly as when the same data is typed. Submit and `validateForm()` still
    // validate the root.
    const conditional: RJSFSchema = {
      type: 'object',
      properties: { c: { type: 'string' }, d: { type: 'number' } },
      if: { properties: { c: { const: 'yes' } }, required: ['c'] },
      then: { required: ['d'], properties: { d: { minimum: 100 } } },
    };
    const props = { schema: conditional, liveValidate: 'onChange' as const, showErrorList: 'top' as const };
    const { node, rerender } = createFormComponent({ ...props, formData: { c: 'no', d: 1 } });
    rerender({ ...props, formData: { c: 'yes', d: 1 } });

    expect(node.querySelector('.panel-danger.errors')).toHaveTextContent('must be >= 100');
    expect(node.querySelector('.panel-danger.errors')).not.toHaveTextContent('must match "then" schema');
  });

  it('turning noValidate on drops the validator results, so turning it back off does not bring them back', () => {
    const formRef = createRef<Form>();
    const props = { ref: formRef, schema: { type: 'string', minLength: 8 } as RJSFSchema, formData: 'short' };
    const { node, rerender } = createFormComponent(props);
    act(() => {
      formRef.current!.validateForm();
    });
    expect(errorListMessages(node)).toEqual(['must NOT have fewer than 8 characters']);

    rerender({ ...props, noValidate: true });
    expect(errorListMessages(node)).toEqual([]);

    rerender(props);
    expect(errorListMessages(node)).toEqual([]);
  });

  it('a changed idPrefix rebuilds the registry, so the fields render with the new ids', () => {
    const { node, rerender } = createFormComponent({ schema });
    expect(node.querySelector('#root_a')).not.toBeNull();

    rerender({ schema, idPrefix: 'other' });

    expect(node.querySelector('#root_a')).toBeNull();
    expect(node.querySelector('#other_a')).not.toBeNull();
  });
});
