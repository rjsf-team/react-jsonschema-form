import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

import type { AnnouncedMove } from './formState.ts';

/** Private event access for container fields. A field rendered with the form's own data reads the form's latest edit,
 * which in a parent-owned form is a proposal made since the form last rendered; a field handed a view of that data
 * keeps to its view.
 */
interface FormDataAccess {
  /** Changes whenever such a proposal is dropped, at the commit of the form that answers it, and with it a field's
   * record of it
   */
  epoch(): number;
  /** Called before a field sends a proposal. The function it returns, called once the proposal was sent, has the form
   * render, so that its commit ends the field's record of the proposal whatever became of it: a custom parent can keep
   * one to itself, and the form would otherwise never learn of it. A proposal that reached the form had it render
   * already, and is not rendered for twice.
   */
  proposing(): () => void;
  /** Calls `send`, which sends a change that moves the keys of the array or object at `move.fieldPath`: an item to
   * another index, a property to another name, or either out of the data. The form moves the errors it holds under
   * those keys along when the change for that path reaches it before `send` returns, the way `startTransition()` marks
   * the updates made inside its callback. Only the form holds them all, and a field's `onChange` has no way to say
   * where a key went.
   */
  sendMove(move: AnnouncedMove, send: () => void): void;
  /** The latest data at `path`, for a field that renders the form's own data there (see `RawFormDataContext`) */
  readField<D>(path: FieldPath): D;
}
export default createContext<FormDataAccess | undefined>(undefined);
