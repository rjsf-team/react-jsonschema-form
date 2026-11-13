import { use, useCallback } from 'react';
import type { FieldPath } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';

/** Reads a container field's data for its handlers: the form's current data at `fieldPath`, edits made since the form
 * last rendered included, so a second handler in the same event starts from what the first one sent. Outside a `Form`,
 * what `readRendered` returns. Read in a handler rather than closed over, since a handler that changed with the data
 * would re-render every child on every edit.
 *
 * @param fieldPath - The field's `FieldPath`
 * @param readRendered - Returns the field's own record of its data, and keeps its identity across renders
 * @returns - The reader, which keeps its identity while `fieldPath` does
 */
export default function useReadFieldData<D>(fieldPath: FieldPath, readRendered: () => D) {
  const access = use(FormDataContext);
  return useCallback(
    (): D | undefined => (access ? access.readField<D>(fieldPath) : readRendered()),
    [access, fieldPath, readRendered],
  );
}
