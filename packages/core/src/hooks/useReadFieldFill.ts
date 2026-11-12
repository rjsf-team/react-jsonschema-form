import { use, useCallback } from 'react';
import type { FieldFill, FieldPath } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';

/** Reads what the defaults hand the field at `fieldPath`, for a handler sanitizing the field's own data: the default
 * it inherits from the fields above it and whether it is required there. Outside a `Form`, nothing.
 *
 * @param fieldPath - The field's `FieldPath`
 * @returns - The reader, which keeps its identity while `fieldPath` does
 */
export default function useReadFieldFill(fieldPath: FieldPath) {
  const access = use(FormDataContext);
  return useCallback((): FieldFill => access?.readFieldFill(fieldPath) ?? {}, [access, fieldPath]);
}
