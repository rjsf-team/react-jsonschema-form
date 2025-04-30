import { FocusEvent } from 'react';
import { Grid, Label, Button, TextInput } from '@trussworks/react-uswds';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WrapIfAdditionalTemplateProps,
  ADDITIONAL_PROPERTY_FLAG,
  UIOptionsType,
  getTemplate,
  getUiOptions,
  TranslatableString,
} from '@rjsf/utils';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to wrap automatically added additional properties.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    id,
    classNames,
    style,
    label,
    required,
    readonly,
    disabled,
    schema,
    uiSchema,
    onKeyChange,
    onDropPropertyClick,
    children,
    registry,
    formContext,
    ...rest
  } = props;
  const { RemoveButton } = getTemplate<'ButtonTemplates', T, S, F>('ButtonTemplates', registry, getUiOptions(uiSchema));
  const keyLabel = registry.translateString(TranslatableString.KeyLabel, [label]);
  const additional = schema[ADDITIONAL_PROPERTY_FLAG];

  if (!additional) {
    return <>{children}</>;
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);

  return (
    <Grid row gap="md" className="form-additional">
      <Grid col={5}>
        <Label htmlFor={`${id}-key`}>{keyLabel}</Label>
        <TextInput
          id={`${id}-key`}
          name={`${id}-key`}
          defaultValue={label}
          required={required}
          disabled={disabled || readonly}
          onBlur={!readonly ? handleBlur : undefined}
          type="text"
        />
      </Grid>
      <Grid col={5}>
        {children}
      </Grid>
      <Grid col={2}>
        {RemoveButton && (
          <RemoveButton
            disabled={disabled || readonly}
            onClick={onDropPropertyClick(label)}
            uiSchema={uiSchema}
            registry={registry}
            className="array-item-remove usa-button--unstyled"
            style={{ marginTop: '1.5rem' }}
          />
        )}
      </Grid>
    </Grid>
  );
}
