import { createRef } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { act } from '@testing-library/react';

import type Form from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

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

  it('a changed idPrefix rebuilds the registry, so the fields render with the new ids', () => {
    const { node, rerender } = createFormComponent({ schema });
    expect(node.querySelector('#root_a')).not.toBeNull();

    rerender({ schema, idPrefix: 'other' });

    expect(node.querySelector('#root_a')).toBeNull();
    expect(node.querySelector('#other_a')).not.toBeNull();
  });
});
