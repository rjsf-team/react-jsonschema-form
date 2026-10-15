import type { ReactNode } from 'react';
import { chakra, Fieldset, useSlotRecipe } from '@chakra-ui/react';
import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions, hasTemplateErrors, templateDrawsLabel, templateLabelFor } from '@rjsf/utils';

interface TemplateLabelProps {
  id: string;
  htmlFor?: string;
  requiredMarker: boolean;
  disabled?: boolean;
  children: ReactNode;
}

/** The label the template draws, styled by the `field` recipe as the label each widget draws inside its `Field` is */
function TemplateLabel({ id, htmlFor, requiredMarker, disabled, children }: TemplateLabelProps) {
  const fieldStyles = useSlotRecipe({ key: 'field' })();
  return (
    <chakra.label htmlFor={htmlFor} id={id} data-disabled={disabled ? '' : undefined} css={fieldStyles.label} mb={1.5}>
      {children}
      {requiredMarker && (
        <chakra.span css={fieldStyles.requiredIndicator} aria-hidden>
          *
        </chakra.span>
      )}
    </chakra.label>
  );
}

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
      {/* Only under a plan, as for a widget declared to leave its label to the template: without one, `displayLabel`
          falls back to the deprecated prop, and this theme's widgets draw their own label beside it */}
      {presentation && displayLabel && label && (
        <TemplateLabel
          htmlFor={templateLabelFor<T, S, F>(props)}
          id={presentation.label.id}
          requiredMarker={presentation.label.requiredMarker}
          disabled={disabled || readonly}
        >
          {label}
        </TemplateLabel>
      )}
      <Fieldset.Root disabled={disabled} invalid={hasError}>
        {rawDescription ? <Fieldset.Legend mt={2}>{description}</Fieldset.Legend> : null}
        {help}
        <Fieldset.Content>{children}</Fieldset.Content>
        {errors}
      </Fieldset.Root>
    </WrapIfAdditionalTemplate>
  );
}
