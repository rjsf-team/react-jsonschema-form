import { FieldTemplateProps } from '@rjsf/utils';
import { FormGroup, Label } from '@trussworks/react-uswds';

export default function Field(props: FieldTemplateProps) {
  const { id, label, help, required, description, errors, children, hidden } = props;

  if (hidden) {
    return children;
  }

  // Check both for errors array and extraErrors from parent
  const hasErrors = errors?.length > 0 || props.rawErrors?.length > 0;

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
