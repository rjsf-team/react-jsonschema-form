import { use, useCallback } from 'react';
import type { FieldPath, StrictRJSFSchema } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';

/** Returns what sends the change of a `oneOf`/`anyOf` field at `fieldPath` whose option is switched. The fields of the
 * properties only the option that was left declares are gone with the switch, so the form drops the errors it holds
 * under them: one of their own left standing would keep the form from submitting with no field to clear it. The
 * errors under every other key stay, since a property the new option declares too, or one `schema` declares beside
 * its options, is still rendered. The switch is sent as a key move even when nothing is gone, so the field's own raise
 * at its path is kept the way an array's is through a reorder, whatever the options declare.
 */
export default function useSendOptionSwitch(fieldPath: FieldPath) {
  const access = use(FormDataContext);
  return useCallback(
    <S extends StrictRJSFSchema>(schema: S, oldOption: S | undefined, newOption: S | undefined, send: () => void) => {
      if (!access) {
        send();
        return;
      }
      const stillRendered = { ...schema.properties, ...newOption?.properties };
      const gone = new Set(
        Object.keys(oldOption?.properties ?? {}).filter((key) => !Object.hasOwn(stillRendered, key)),
      );
      access.sendMove({ fieldPath, newKeyOf: (key) => (gone.has(key) ? undefined : key) }, send);
    },
    [access, fieldPath],
  );
}
