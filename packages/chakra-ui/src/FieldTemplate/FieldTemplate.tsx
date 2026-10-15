import { Fieldset } from '@chakra-ui/react';
import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions, hasTemplateErrors, templateDrawsLabel } from '@rjsf/utils';

export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    classNames,
    style,
    disabled,
    presentation,
    hidden,
    label,
    keyName,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    readonly,
    registry,
    required,
    errors,
    help,
    description,
    rawDescription,
    schema,
    uiSchema,
  } = props;
  const displayLabel = templateDrawsLabel<T, S, F>(props);
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const hasError = hasTemplateErrors<T, S, F>(props);
  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

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
      <Fieldset.Root disabled={disabled} invalid={hasError}>
        {rawDescription ? <Fieldset.Legend mt={2}>{description}</Fieldset.Legend> : null}
        {help}
        <Fieldset.Content>{children}</Fieldset.Content>
        {errors}
      </Fieldset.Root>
    </WrapIfAdditionalTemplate>
  );
}
