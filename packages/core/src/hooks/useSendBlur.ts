import { use, useCallback } from 'react';
import type { FieldPath, FieldProps } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';
import type { BlurTouch } from '../components/formState.ts';

/** The `onBlur` to hand a widget or field below the field at `fieldPath`: `onBlur`, sending the blur with `fieldPath`
 * as the path it is for and `touches` as what it touches, see `FormDataAccess.sendBlur()`. Outside a `Form` there is
 * nothing to touch, so the blur is just sent.
 *
 * @param fieldPath - The `FieldPath` of the field
 * @param onBlur - The `onBlur` the field was handed
 * @param touches - What a blur sent through the returned `onBlur` touches
 * @returns - The `onBlur` to hand down
 */
export default function useSendBlur(
  fieldPath: FieldPath,
  onBlur: FieldProps['onBlur'],
  touches: BlurTouch,
): FieldProps['onBlur'] {
  const access = use(FormDataContext);
  return useCallback(
    (id: string, value: unknown) => {
      if (access) {
        access.sendBlur(fieldPath, touches, () => onBlur(id, value));
      } else {
        onBlur(id, value);
      }
    },
    [access, fieldPath, onBlur, touches],
  );
}
