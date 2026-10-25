import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

import type { AnnouncedMove, MoveOutcome } from './formState.ts';

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
   * Returns what became of that change, so a field that moved its own record of the keys, such as an array's row keys,
   * can move it back where `transformChange` refused the change, or rewrote it; `undefined` when the change never
   * reached the form at that path.
   */
  sendMove(move: AnnouncedMove, send: () => void): MoveOutcome | undefined;
  /** Calls `send`, which sends the blur a widget reported, with `fieldPath` as the path of the field it touches. The
   * innermost field names it: a blur passes up through every `SchemaField` above the widget, and only the first to
   * send it knows the path the widget renders. A widget's `onBlur` names an id, which a custom `idPrefix` or
   * `idSeparator` can make ambiguous, so the path travels this way instead
   */
  sendBlur(fieldPath: FieldPath, send: () => void): void;
  /** The form's current data at `path` */
  readField<D>(path: FieldPath): D;
  /** The form's data at `path` as its last commit rendered it, which a field rendered in that commit was handed */
  readRenderedField<D>(path: FieldPath): D;
}
export default createContext<FormDataAccess | undefined>(undefined);
