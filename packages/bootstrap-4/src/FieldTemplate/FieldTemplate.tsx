import {
  FieldTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import Form from 'react-bootstrap/Form';

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  id,
  children,
  displayLabel,
  rawErrors = [],
  errors,
  help,
  description,
  rawDescription,
  classNames,
  style,
  disabled,
  label,
  hidden,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: FieldTemplateProps<T, S, F>) {
  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
  );
  if (hidden) {
    return <div className='hidden'>{children}</div>;
  }
  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <Form.Group>
        {displayLabel && (
          <Form.Label htmlFor={id} className={rawErrors.length > 0 ? 'text-danger' : ''}>
            {label}
            {required ? '*' : null}
          </Form.Label>
        )}
        {children}
        {displayLabel && rawDescription && (
          <Form.Text className={rawErrors.length > 0 ? 'text-danger' : 'text-muted'}>{description}</Form.Text>
        )}
        {errors}
        {help}
      </Form.Group>
    </WrapIfAdditionalTemplate>
  );
}
