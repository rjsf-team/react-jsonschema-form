import { useCallback } from 'react';
import { Flex, Grid, TextInput } from '@mantine/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, UI_OPTIONS_KEY, buttonId, TranslatableString, getWidget } from '@rjsf/utils';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
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
    displayLabel,
    rawDescription,
    required,
    readonly,
    disabled,
    schema,
    uiSchema,
    onKeyRenameBlur,
    onRemoveProperty,
    registry,
    children,
    propertyNamesEnum,
  } = props;
  const { templates, translateString, widgets } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

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

  // The `block` prop is not part of the `IconButtonProps` defined in the template, so put it into the uiSchema instead
  const uiOptions = uiSchema ? uiSchema[UI_OPTIONS_KEY] : {};
  const buttonUiOptions = {
    ...uiSchema,
    [UI_OPTIONS_KEY]: { ...uiOptions, block: true },
  };

  return (
    <div className={classNames} style={style}>
      <Flex gap='xs' align='end' justify='center'>
        <Grid w='100%' align='center'>
          <Grid.Col span={6} className='form-additional'>
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
              <TextInput
                key={label}
                className='form-group'
                label={displayLabel ? keyLabel : undefined}
                defaultValue={label}
                required={required}
                description={rawDescription ? '\u00A0' : undefined}
                disabled={disabled || readonly}
                id={`${id}-key`}
                name={`${id}-key`}
                onBlur={!readonly ? onKeyRenameBlur : undefined}
              />
            )}
          </Grid.Col>
          <Grid.Col span={6} className='form-additional'>
            {children}
          </Grid.Col>
        </Grid>
        <div>
          <RemoveButton
            id={buttonId(id, 'remove')}
            iconType='sm'
            className='rjsf-array-item-remove'
            disabled={disabled || readonly}
            onClick={onRemoveProperty}
            uiSchema={buttonUiOptions}
            registry={registry}
          />
        </div>
      </Flex>
    </div>
  );
}
