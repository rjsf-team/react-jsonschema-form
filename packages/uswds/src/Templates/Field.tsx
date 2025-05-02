import { FormContextType, RJSFSchema, StrictRJSFSchema, FieldTemplateProps } from '@rjsf/utils';
import { FormGroup, Label } from '@trussworks/react-uswds';

export default function Field<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldTemplateProps<T, S, F>
) {
  const { id, label, children, errors, help, description, hidden, required, rawErrors = [] } = props;
  if (hidden) {
    return children;
  }

  return (
    <FormGroup error={rawErrors.length > 0}>
      {label && <Label htmlFor={id} error={rawErrors.length > 0}>
        {label}
        {required && <span className="usa-label--required">*</span>}
      </Label>}
      {description && <div className="usa-hint">{description}</div>}
      {children}
      {errors}
      {help && <div className="usa-hint">{help}</div>}
    </FormGroup>
  );
}
