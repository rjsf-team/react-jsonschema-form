import { useEffect } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import OwnTitleAndDescription from './OwnTitleAndDescription.tsx';

/** The `NullField` component is used to render a field in the schema is null. It also ensures that the `formData` is
 * also set to null if it has no value. It has no control for a label to name, so it draws its own title and
 * description, as an object draws its heading, where its plan says it does.
 *
 * @param props - The `FieldProps` for this template
 */
function NullField<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: FieldProps<T, S, F>,
) {
  const { formData, onChange, fieldPath } = props;
  useEffect(() => {
    if (formData === undefined) {
      onChange(null as unknown as T, fieldPath);
    }
  }, [fieldPath, formData, onChange]);

  return <OwnTitleAndDescription<T, S, F> {...props} />;
}

export default NullField;
