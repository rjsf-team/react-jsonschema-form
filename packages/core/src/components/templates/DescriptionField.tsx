import type { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { joinClassNames } from '@rjsf/utils';

import RichDescription from '../RichDescription.tsx';

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, registry, uiSchema } = props;
  const { classMap } = registry;
  if (!description) {
    return null;
  }
  return (
    <div id={id} className={joinClassNames('field-description', classMap.fieldDescription)}>
      <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}
