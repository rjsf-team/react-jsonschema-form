import { useRef } from 'react';
import isEqual from 'lodash/isEqual';

import { FieldPathId } from './types';

/** Hook that stores and returns a `FieldPathId`. If `newFieldPathId` is the same as the stored one, then the stored one
 * is returned to avoid having a component rerender due it being a different object. Otherwise, the `newFieldPathId` is
 * stored and returned.
 *
 * @param newFieldPathId - The potential new `FieldPathId`
 * @returns - The latest stored `FieldPathId`
 */
export default function useFieldPathId(newFieldPathId: FieldPathId): FieldPathId {
  const fieldPathIdRef = useRef<FieldPathId>(newFieldPathId);
  if (!isEqual(newFieldPathId, fieldPathIdRef.current)) {
    fieldPathIdRef.current = newFieldPathId;
  }
  return fieldPathIdRef.current;
}
