import type { ReactNode } from 'react';
import { Fieldset, useSlotRecipe } from '@chakra-ui/react';
import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  getTemplates,
  getUiOptions,
  hasTemplateErrors,
  templateDrawsDescription,
  templateDrawsLabel,
  templateDrawsPlannedLabel,
  templateLabelFor,
  templateMarksRequired,
} from '@rjsf/utils';

import { RecipeLabel, RequiredMarker } from '../components/ui/field.tsx';
import { labelledByOrNone } from '../utils.ts';

interface TemplateLabelProps {
  id?: string;
  htmlFor?: string;
  requiredMarker: boolean;
  disabled?: boolean;
  children: ReactNode;
}

/** The label the template draws, styled by the `field` recipe as the label each widget draws inside its `Field` is */
function TemplateLabel({ id, htmlFor, requiredMarker, disabled, children }: TemplateLabelProps) {
  const fieldStyles = useSlotRecipe({ key: 'field' })();
  return (
    <RecipeLabel htmlFor={htmlFor} id={id} data-disabled={disabled ? '' : undefined} css={fieldStyles.label} mb={1.5}>
      {children}
      {requiredMarker && <RequiredMarker />}
    </RecipeLabel>
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

  const drawsLabel = templateDrawsPlannedLabel<T, S, F>(props);

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
      {drawsLabel && (
        <TemplateLabel
          htmlFor={templateLabelFor<T, S, F>(props)}
          id={presentation?.label.id}
          requiredMarker={templateMarksRequired<T, S, F>(props)}
          disabled={disabled || readonly}
        >
          {label}
        </TemplateLabel>
      )}
      {/* Ark points the fieldset at its legend, which renders only for a description, so it is pointed at nothing, which
          leaves a description's legend naming it. The label drawn here already names the control or group inside, so
          naming the fieldset by it too would announce that name twice */}
      <Fieldset.Root disabled={disabled} invalid={hasError} aria-labelledby={labelledByOrNone(undefined, false)}>
        {templateDrawsDescription<T, S, F>(props) && rawDescription ? (
          <Fieldset.Legend mt={2}>{description}</Fieldset.Legend>
        ) : null}
        {help}
        <Fieldset.Content>{children}</Fieldset.Content>
        {errors}
      </Fieldset.Root>
    </WrapIfAdditionalTemplate>
  );
}
