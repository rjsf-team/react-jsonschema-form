import { use, useCallback } from 'react';
import type { FieldPath } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';
import type { AnnouncedMove, MoveOutcome } from '../components/formState.ts';

/** Sends a change that moves the keys of the array or object at `fieldPath`, see `FormDataAccess.sendMove()`. Outside a
 * `Form` there are no errors to move and no `transformChange` to refuse the change, so the change is just sent.
 *
 * @param fieldPath - The `FieldPath` of the array or object whose keys move
 * @returns - Calls `send` with the move announced, and returns what became of the change
 */
export default function useSendMove(fieldPath: FieldPath) {
  const access = use(FormDataContext);
  return useCallback(
    (move: Omit<AnnouncedMove, 'fieldPath'>, send: () => void): MoveOutcome => {
      if (access) {
        return access.sendMove({ ...move, fieldPath }, send);
      }
      send();
      return 'taken';
    },
    [access, fieldPath],
  );
}
