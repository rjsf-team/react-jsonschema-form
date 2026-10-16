import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions, hasTemplateErrors, templateDrawsLabel, templateLabelFor } from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    presentation,
    errors,
    help,
    description,
    rawDescription,
    classNames,
    style,
    disabled,
    label,
    keyName,
    hidden,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    readonly,
    required,
    schema,
    uiSchema,
    registry,
  } = props;
  const displayLabel = templateDrawsLabel<T, S, F>(props);
  const uiOptions = getUiOptions(uiSchema);
  const hasError = hasTemplateErrors<T, S, F>(props);
  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  if (hidden) {
    return <div className='hidden'>{children}</div>;
  }
  // The plan's label and description already say what a checkbox draws itself; the guess by the `checkbox`
  // alias is left for a template rendered without one, so a part the plan gives the template isn't dropped
  const leavesPartsToCheckbox = !presentation && uiOptions.widget === 'checkbox';

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      keyName={keyName}
      // oxlint-disable-next-line typescript/no-deprecated -- handed on to a `WrapIfAdditionalTemplate` rendered without a plan, which labels the key by it
      displayLabel={displayLabel}
      presentation={presentation}
      rawDescription={rawDescription}
      onKeyRename={onKeyRename}
      onKeyRenameBlur={onKeyRenameBlur}
      onRemoveProperty={onRemoveProperty}
      propertyNamesEnum={propertyNamesEnum}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <Form.Group>
        {displayLabel && !leavesPartsToCheckbox && (
          <Form.Label
            htmlFor={templateLabelFor<T, S, F>(props)}
            id={presentation?.label.id}
            className={hasError ? 'text-danger' : ''}
          >
            {label}
            {required ? '*' : null}
          </Form.Label>
        )}
        {children}
        {rawDescription && !leavesPartsToCheckbox && (
          <Form.Text className={hasError ? 'text-danger' : 'text-muted'}>{description}</Form.Text>
        )}
        {errors}
        {help}
      </Form.Group>
    </WrapIfAdditionalTemplate>
  );
}
