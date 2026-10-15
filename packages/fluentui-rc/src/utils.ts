import type { ReactNode } from 'react';
import { fieldLabelId } from '@rjsf/utils';

/** Builds the `label` slot of a Fluent `Field` around a control carrying an id of its caller's: Fluent would point the
 * label's `for` at an id it generates, which no element has
 *
 * @param children - The label's contents
 * @param controlId - The id of the control the label names
 * @returns - The slot's props, with a `for` naming the control and the control's `fieldLabelId()`
 */
export function fieldLabelSlot(children: ReactNode, controlId: string) {
  return { children, htmlFor: controlId, id: fieldLabelId(controlId) };
}
