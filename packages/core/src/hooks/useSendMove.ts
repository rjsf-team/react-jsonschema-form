import { use, useCallback } from 'react';
import type { FieldPath } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';
import type { AnnouncedMove } from '../components/formState.ts';

/** Sends a change that moves the keys of the array or object at `fieldPath`, see `FormDataAccess.sendMove()`. Outside a
 * `Form` there are no errors to move, so the change is just sent.
 *
 * @param fieldPath - The `FieldPath` of the array or object whose keys move
 * @returns - Calls `send` with the move announced
 */
export default function useSendMove(fieldPath: FieldPath) {
  const access = use(FormDataContext);
  return useCallback(
    (move: Omit<AnnouncedMove, 'fieldPath'>, send: () => void) => {
      if (access) {
        access.sendMove({ ...move, fieldPath }, send);
      } else {
        send();
      }
    },
    [access, fieldPath],
  );
}
