import type { RJSFSchema } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG } from '@rjsf/utils';

import { withoutAdditionalFlag } from '../src/components/fields/fieldWidgetUtils.ts';

describe('withoutAdditionalFlag()', () => {
  it('returns a boolean subschema as it is', () => {
    const booleanSubschema = true as unknown as RJSFSchema;

    expect(withoutAdditionalFlag(booleanSubschema)).toBe(true);
  });

  it('copies a flagged schema without the flag', () => {
    const flagged: RJSFSchema = { type: 'string' };
    Reflect.set(flagged, ADDITIONAL_PROPERTY_FLAG, true);

    expect(withoutAdditionalFlag(flagged)).toEqual({ type: 'string' });
    expect(ADDITIONAL_PROPERTY_FLAG in withoutAdditionalFlag(flagged)).toBe(false);
  });
});
