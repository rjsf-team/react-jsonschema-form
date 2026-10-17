import { use, useEffect, useRef } from 'react';
import type { FieldPath } from '@rjsf/utils';
import { deepEquals } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';
import { isDevelopment } from '../components/formState.ts';

/** In development, warns once when a container field is rendered with other `formData` than the form held at its
 * `fieldPath` in the same commit. Its handlers read the form's value there to add, remove, rename or reorder, so a
 * custom field that hands it a transformed copy, such as a sorted list, has them act on items it does not show, with
 * nothing else to say so. Checked after the commit, against what that commit rendered, so an edit made since, such as a
 * widget's from a layout Effect, is not mistaken for one.
 *
 * @param fieldName - The name of the container field, for the warning
 * @param id - The field's id, for the warning
 * @param fieldPath - The field's `FieldPath`
 * @param formData - The `formData` the field was rendered with
 */
export default function useWarnIfFormDataNotPassedThrough(
  fieldName: string,
  id: string,
  fieldPath: FieldPath,
  formData: unknown,
) {
  const access = use(FormDataContext);
  const isWarned = useRef(false);
  useEffect(() => {
    if (!isDevelopment || !access || isWarned.current) {
      return;
    }
    const held = access.readRenderedField<unknown>(fieldPath);
    if (Object.is(held, formData) || deepEquals(held, formData)) {
      return;
    }
    isWarned.current = true;
    // oxlint-disable-next-line no-console
    console.warn(
      `${fieldName} \`${id}\` was rendered with other \`formData\` than the form holds at its \`fieldPath\`. A custom field wrapping it must pass \`formData\` through unchanged, or adding, removing, renaming and reordering act on items it doesn't show. See https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#custom-fields-that-wrap-arrayfield-or-objectfield`,
    );
  }, [access, fieldName, id, fieldPath, formData]);
}
