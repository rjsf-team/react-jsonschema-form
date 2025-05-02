import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `DescriptionField` component renders the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ description, id }: DescriptionFieldProps<T, S, F>) {
  if (!description) {
    return null;
  }

  return (
    <span id={id} className="field-description">
      {description}
    </span>
  );
}
