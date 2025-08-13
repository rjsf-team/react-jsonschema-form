import { FocusEvent, useCallback } from 'react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  UI_OPTIONS_KEY,
  buttonId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import { Flex, Grid, TextInput } from '@mantine/core';

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
    required,
    readonly,
    disabled,
    schema,
    uiSchema,
    onKeyChange,
    onDropPropertyClick,
    registry,
    children,
  } = props;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target && target.value),
    [onKeyChange],
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
            <div className='form-group'>
              <TextInput
                className='form-group'
                label={keyLabel}
                defaultValue={label}
                required={required}
                disabled={disabled || readonly}
                id={`${id}-key`}
                name={`${id}-key`}
                onBlur={!readonly ? handleBlur : undefined}
              />
            </div>
          </Grid.Col>
          <Grid.Col span={6} className='form-additional'>
            {children}
          </Grid.Col>
        </Grid>
        <RemoveButton
          id={buttonId<T>(id, 'remove')}
          iconType='sm'
          className='rjsf-array-item-remove'
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
          uiSchema={buttonUiOptions}
          registry={registry}
        />
      </Flex>
    </div>
  );
}
