import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

import type { BlurTouch } from './formState.ts';
import type { AnnouncedMove, MoveOutcome } from './keyMove.ts';

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
  /** Calls `send`, which sends the blur a widget reported with `id`, with `fieldPath` as the path of the field it is
   * for and `touches` as what it touches. The innermost field names them: a blur passes up through every `SchemaField`
   * above the widget, and only the first to send it knows the path the widget renders and whether the widget is the
   * field's own or its option selector. A widget's `onBlur` names an id, which a custom `idPrefix` or `idSeparator` can
   * make ambiguous, so the path travels this way instead. A field above that sends a blur with another id while one is
   * on its way, such as its own widget's before forwarding the one from below, names that blur itself. With `replaces`,
   * the blur is named here even though a field below named it, for a field whose control below sits at a path no data
   * is stored at
   */
  sendBlur(id: string, fieldPath: FieldPath, touches: BlurTouch, send: () => void, replaces?: boolean): void;
  /** The form's current data at `path` */
  readField<D>(path: FieldPath): D;
  /** The form's data at `path` as its last commit rendered it, which a field rendered in that commit was handed */
  readRenderedField<D>(path: FieldPath): D;
}
export default createContext<FormDataAccess | undefined>(undefined);
