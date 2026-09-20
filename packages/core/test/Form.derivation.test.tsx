import type { RJSFSchema } from '@rjsf/utils';

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

  it('a changed idPrefix rebuilds the registry, so the fields render with the new ids', () => {
    const { node, rerender } = createFormComponent({ schema });
    expect(node.querySelector('#root_a')).not.toBeNull();

    rerender({ schema, idPrefix: 'other' });

    expect(node.querySelector('#root_a')).toBeNull();
    expect(node.querySelector('#other_a')).not.toBeNull();
  });
});
