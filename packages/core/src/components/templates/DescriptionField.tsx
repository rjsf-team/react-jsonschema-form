import type { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { clsx } from 'clsx';

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
  const { id, description, registry, uiSchema, hasErrors } = props;
  const { classMap } = registry;
  if (!description) {
    return null;
  }
  return (
    <div
      id={id}
      className={clsx('field-description', classMap.fieldDescription, hasErrors && classMap.descriptionError)}
    >
      <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}
