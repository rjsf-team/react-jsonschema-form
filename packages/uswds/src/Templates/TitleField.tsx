import { TitleFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `TitleField` is the template used to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: TitleFieldProps<T, S, F>) {
  const { id, title, required } = props;

  // Render title using H1 tag
  // Note: This will render ALL titles as H1, including nested ones.
  // A more complex implementation might check the schema or id to render H1 only for the root.
  return (
    <h1 id={id} className="usa-heading"> {/* Use H1 and USWDS heading class */}
      {title}
      {required && <span className="usa-label--required usa-label--inline">*</span>} {/* Add inline class */}
    </h1>
  );
}
