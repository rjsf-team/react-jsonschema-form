import { TitleFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils'; // Removed "Template" from the beginning

// Renamed function to TitleFieldTemplate
export default function TitleFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, title, required }: TitleFieldProps<T, S, F>) {
  // Added required prop
  if (!title) {
    return null;
  }

  // Using h5 based on potential USWDS guidelines for fieldset legends, adjust if needed
  // Added required marker logic
  return (
    <h5 id={id} className="usa-legend">
      {title}
      {required && <span className="usa-label--required">*</span>}
    </h5>
  );
}
