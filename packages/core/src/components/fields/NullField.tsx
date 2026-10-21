import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import OwnTitleAndDescription from './OwnTitleAndDescription.tsx';

/** The `NullField` component is used to render a field in the schema that is null. It writes no data: the form's data
 * derivation fills a missing `null` value in, see `computeDefaults()` in `@rjsf/utils`. It has no control for a label
 * to name, so it draws its own title and description, as an object draws its heading, where its plan says it does.
 *
 * @param props - The `FieldProps` for this template
 */
function NullField<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: FieldProps<T, S, F>,
) {
  return <OwnTitleAndDescription<T, S, F> {...props} />;
}

export default NullField;
