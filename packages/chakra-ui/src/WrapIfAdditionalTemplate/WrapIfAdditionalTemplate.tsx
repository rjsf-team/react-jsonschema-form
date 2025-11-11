import {
  ADDITIONAL_PROPERTY_FLAG,
  buttonId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import { Grid, GridItem, Input } from '@chakra-ui/react';

import { Field } from '../components/ui/field';

export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    style,
    disabled,
    displayLabel,
    id,
    label,
    onRemoveProperty,
    onKeyRenameBlur,
    rawDescription,
    readonly,
    registry,
    required,
    schema,
    uiSchema,
  } = props;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = displayLabel ? translateString(TranslatableString.KeyLabel, [label]) : undefined;
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const hasDescription = !!rawDescription;
  const margin = hasDescription ? 58 : 22;
  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  return (
    <Grid
      key={`${id}-key`}
      templateColumns='repeat(11, 1fr)'
      className={classNames}
      style={style}
      alignItems='center'
      gap={2}
    >
      <GridItem colSpan={5} style={{ marginTop: hasDescription ? '36px' : undefined }}>
        <Field required={required} label={keyLabel}>
          <Input
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? onKeyRenameBlur : undefined}
            type='text'
            mb={1}
          />
        </Field>
      </GridItem>
      <GridItem colSpan={5}>{children}</GridItem>
      <GridItem justifySelf='flex-end' style={{ marginTop: displayLabel ? `${margin}px` : undefined }}>
        <RemoveButton
          id={buttonId(id, 'remove')}
          className='rjsf-object-property-remove'
          disabled={disabled || readonly}
          onClick={onRemoveProperty}
          uiSchema={uiSchema}
          registry={registry}
        />
      </GridItem>
    </Grid>
  );
}
