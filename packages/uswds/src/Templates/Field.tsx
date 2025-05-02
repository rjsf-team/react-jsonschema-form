import { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { FormGroup, Label } from '@trussworks/react-uswds';

export default function Field<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldTemplateProps<T, S, F>
) {
  const { id, label, help, required, description, errors, children, hidden } = props;

  if (hidden) {
    return children;
  }

  const hasErrors = Array.isArray(errors) && errors.length > 0;

  return (
    <FormGroup error={hasErrors}>
      {label && (
        <Label htmlFor={id} error={hasErrors}>
          {label}
          {required && <span className="usa-label--required">*</span>}
        </Label>
      )}
      {description && <div className="usa-hint">{description}</div>}
      {children}
      {errors}
      {help && <div className="usa-hint">{help}</div>}
    </FormGroup>
  );
}
