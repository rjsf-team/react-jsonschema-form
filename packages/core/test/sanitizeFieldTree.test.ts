import type { RJSFMarkedSchema } from '@rjsf/utils';
import { GUESSED_TYPE_FLAG } from '@rjsf/utils';

import { hasSameConstraints } from '../src/components/sanitizeFieldTree.ts';

describe('hasSameConstraints()', () => {
  it('reads a type guessed from the data as no type', () => {
    const guessed: RJSFMarkedSchema = { type: 'string', [GUESSED_TYPE_FLAG]: true };

    expect(hasSameConstraints(guessed, {}, undefined, undefined)).toBe(true);
  });

  it.each([undefined, false])('reads the type of a schema whose guessed-type flag is %s', (flag) => {
    const declared: RJSFMarkedSchema = { type: 'string', [GUESSED_TYPE_FLAG]: flag };

    expect(hasSameConstraints(declared, {}, undefined, undefined)).toBe(false);
  });
});
