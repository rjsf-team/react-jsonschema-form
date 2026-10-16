import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

import type { AnnouncedMove } from './formState.ts';

/** Private event access for container fields, which read the form's current data at their path, edits made since the
 * form last rendered included, instead of the data they rendered
 */
interface FormDataAccess {
  /** Calls `send`, which sends a change that moves the keys of the array or object at `move.fieldPath`: an item to
   * another index, a property to another name, or either out of the data. The form moves the errors it holds under
   * those keys along when the change for that path reaches it before `send` returns, the way `startTransition()` marks
   * the updates made inside its callback. Only the form holds them all, and a field's `onChange` has no way to say
   * where a key went.
   *
   * Returns whether `transformChange` refused that change, which leaves the keys where they were, so a field that
   * moved its own record of them, such as an array's row keys, can move it back.
   */
  sendMove(move: AnnouncedMove, send: () => void): boolean;
  /** The form's current data at `path` */
  readField<D>(path: FieldPath): D;
}
export default createContext<FormDataAccess | undefined>(undefined);
