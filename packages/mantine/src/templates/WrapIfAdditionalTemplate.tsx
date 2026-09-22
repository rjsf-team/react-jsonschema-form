import { Flex, Grid, TextInput } from '@mantine/core';
import type {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import {
  AdditionalPropertyKeySelect,
  ADDITIONAL_PROPERTY_FLAG,
  UI_OPTIONS_KEY,
  buttonId,
  TranslatableString,
} from '@rjsf/utils';

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
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    registry,
    children,
  } = props;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  // The `block` prop is not part of the `IconButtonProps` defined in the template, so put it into the uiSchema instead
  const baseUiSchema: UiSchema<T, S, F> = uiSchema ?? {};
  const buttonUiOptions: UiSchema<T, S, F> = {
    ...baseUiSchema,
    [UI_OPTIONS_KEY]: { ...baseUiSchema[UI_OPTIONS_KEY], block: true },
  };

  return (
    <div className={classNames} style={style}>
      <Flex gap='xs' align='end' justify='center'>
        <Grid w='100%' align='center'>
          <Grid.Col span={6} className='form-additional'>
            {propertyNamesEnum ? (
              <AdditionalPropertyKeySelect<T, S, F>
                id={`${id}-key`}
                label={keyLabel}
                hideLabel={!displayLabel}
                value={label}
                propertyNamesEnum={propertyNamesEnum}
                onKeyRename={onKeyRename}
                disabled={disabled}
                readonly={readonly}
                required={required}
                registry={registry}
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
