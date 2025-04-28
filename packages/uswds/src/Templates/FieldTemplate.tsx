import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from '@rjsf/utils';
import { FormGroup, Label } from '@trussworks/react-uswds';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    classNames,
    style,
    displayLabel,
    errors,
    help,
    hidden,
    label,
    required,
    schema,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions,
  );
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  const hasErrors = errors && errors.props.errors && errors.props.errors.length > 0;

  return (
    <WrapIfAdditionalTemplate {...props}>
      <FormGroup error={hasErrors} className={classNames} style={style}>
        {displayLabel && (
          <Label htmlFor={id}>
            {label}
            {required && <span className="required">*</span>}
          </Label>
        )}
        {displayLabel && uiOptions.description !== false && (
          <DescriptionFieldTemplate
            id={`${id}__description`}
            description={uiOptions.description || schema.description || ''}
            registry={registry}
            schema={schema}
            uiSchema={uiSchema}
          />
        )}
        {children}
        {errors}
        {help}
      </FormGroup>
    </WrapIfAdditionalTemplate>
  );
}
