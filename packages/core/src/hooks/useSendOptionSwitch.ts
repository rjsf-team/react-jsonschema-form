import { use, useCallback } from 'react';
import type { FieldPath, StrictRJSFSchema } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';

/** Returns what sends the change of a `oneOf`/`anyOf` field at `fieldPath` whose option is switched. The option's
 * fields are rendered anew under the new option's schema, so the form drops the errors it holds under every key the
 * option that was left declared or the data held, the validator's and the fields' own: a raise of a widget that is
 * gone, or that another widget now renders for, would stand with no field to clear it, and the validator's describe
 * constraints that no longer apply. The keys of the properties `schema` declares beside its options stay, since those
 * fields stay as they are. The errors raised at the field's own path go too, whatever the options declare.
 */
export default function useSendOptionSwitch(fieldPath: FieldPath) {
  const access = use(FormDataContext);
  return useCallback(
    <S extends StrictRJSFSchema>(schema: S, oldOption: S | undefined, formData: unknown, send: () => void) => {
      if (!access) {
        send();
        return;
      }
      const kept = schema.properties ?? {};
      const held = typeof formData === 'object' && formData !== null ? Object.keys(formData) : [];
      const gone = new Set(
        [...Object.keys(oldOption?.properties ?? {}), ...held].filter((key) => !Object.hasOwn(kept, key)),
      );
      access.sendMove({ fieldPath, newKeyOf: (key) => (gone.has(key) ? undefined : key), dropsOwnErrors: true }, send);
    },
    [access, fieldPath],
  );
}
