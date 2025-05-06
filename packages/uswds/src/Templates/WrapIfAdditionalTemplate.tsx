import React from 'react';
import { Grid, Label, TextInput } from '@trussworks/react-uswds';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WrapIfAdditionalTemplateProps,
  TranslatableString,
} from '@rjsf/utils';

export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    disabled,
    id,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    required,
    schema,
    uiSchema,
    registry,
  } = props;
  const { templates, translateString } = registry;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = schema.additionalProperties;

  if (!additional) {
    return <>{children}</>;
  }

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) => onKeyChange(target.value);

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
      <Grid col={5}>{children}</Grid>
      <Grid col={2}>
        {templates.ButtonTemplates.RemoveButton && (
          <templates.ButtonTemplates.RemoveButton
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
