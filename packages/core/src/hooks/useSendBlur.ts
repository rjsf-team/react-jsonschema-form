import { use, useCallback } from 'react';
import type { FieldPath, FieldProps } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';

/** The `onBlur` a `SchemaField` hands its field: `onBlur`, sending the blur with `fieldPath` as the path of the field
 * it touches, see `FormDataAccess.sendBlur()`. Outside a `Form` there is nothing to touch, so the blur is just sent.
 *
 * @param fieldPath - The `FieldPath` of the field
 * @param onBlur - The `onBlur` the field was handed
 * @returns - The `onBlur` to hand the field
 */
export default function useSendBlur(fieldPath: FieldPath, onBlur: FieldProps['onBlur']): FieldProps['onBlur'] {
  const access = use(FormDataContext);
  return useCallback(
    (id: string, value: unknown) => {
      if (access) {
        access.sendBlur(fieldPath, () => onBlur(id, value));
      } else {
        onBlur(id, value);
      }
    },
    [access, fieldPath, onBlur],
  );
}
