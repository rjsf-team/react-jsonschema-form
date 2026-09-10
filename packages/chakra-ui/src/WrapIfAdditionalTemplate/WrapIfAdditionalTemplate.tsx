import { useCallback } from 'react';
import { Grid, GridItem, Input } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, buttonId, TranslatableString, getWidget } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';

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
    propertyNamesEnum,
  } = props;
  const { templates, translateString, widgets } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = displayLabel ? translateString(TranslatableString.KeyLabel, [label]) : undefined;
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const hasDescription = !!rawDescription;
  const margin = hasDescription ? 58 : 22;

  // Use SelectWidget when propertyNamesEnum is available
  const SelectWidget = propertyNamesEnum && propertyNamesEnum.length > 0 ? getWidget(widgets, 'SelectWidget') : null;
  const enumOptions = propertyNamesEnum?.map((value) => ({ value, label: String(value) })) ?? [];

  // Handle onBlur for SelectWidget which expects (id: string, value: any) => void
  // but onKeyRenameBlur expects (event: FocusEvent<HTMLInputElement>) => void
  const handleSelectBlur = useCallback(
    (_id: string, value: any) => {
      onKeyRenameBlur({ target: { value } } as any);
    },
    [onKeyRenameBlur],
  );

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
          {SelectWidget ? (
            <SelectWidget
              key={label}
              id={`${id}-key`}
              name={`${id}-key`}
              value={label}
              required={required}
              disabled={disabled || readonly}
              readonly={readonly}
              options={{
                enumOptions,
                enumDisabled: [],
              }}
              onBlur={handleSelectBlur}
              onFocus={handleSelectBlur}
              onChange={(value) => {
                onKeyRenameBlur({ target: { value } } as any);
              }}
              schema={{ type: 'string', enum: propertyNamesEnum }}
              as
              any
              registry={registry as any}
              uiSchema={uiSchema as any}
              label={keyLabel}
            />
          ) : (
            <Input
              key={label}
              defaultValue={label}
              disabled={disabled || readonly}
              id={`${id}-key`}
              name={`${id}-key`}
              onBlur={!readonly ? onKeyRenameBlur : undefined}
              type='text'
              mb={1}
            />
          )}
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
