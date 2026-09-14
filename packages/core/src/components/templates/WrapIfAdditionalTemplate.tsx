import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, buttonId, TranslatableString, getWidget } from '@rjsf/utils';

import Label from './FieldTemplate/Label.tsx';

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
    disabled,
    displayLabel,
    label,
    onKeyRenameBlur,
    onRemoveProperty,
    rawDescription,
    readonly,
    required,
    schema,
    hideError,
    rawErrors,
    children,
    uiSchema,
    registry,
    propertyNamesEnum,
  } = props;
  const { templates, translateString, widgets } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const hasDescription = !!rawDescription;

  const classNamesList = ['form-group', classNames];
  if (!hideError && rawErrors && rawErrors.length > 0) {
    classNamesList.push('has-error has-danger');
  }
  const uiClassNames = classNamesList.join(' ').trim();

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
      <div className={uiClassNames} style={style}>
        {children}
      </div>
    );
  }
  const margin = hasDescription ? 46 : 26;

  return (
    <div className={uiClassNames} style={style}>
      <div className='row'>
        <div className='col-xs-5 form-additional'>
          <div className='form-group'>
            {displayLabel && <Label label={keyLabel} required={required} id={`${id}-key`} />}
            {displayLabel && rawDescription && <div>&nbsp;</div>}
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
              <input
                key={label}
                className='form-control'
                type='text'
                id={`${id}-key`}
                onBlur={onKeyRenameBlur}
                defaultValue={label}
              />
            )}
          </div>
        </div>
        <div className='form-additional form-group col-xs-5'>{children}</div>
        <div className='col-xs-2' style={{ marginTop: displayLabel ? `${margin}px` : undefined }}>
          <RemoveButton
            id={buttonId(id, 'remove')}
            className='rjsf-object-property-remove btn-block'
            style={{ border: '0' }}
            disabled={disabled || readonly}
            onClick={onRemoveProperty}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      </div>
    </div>
  );
}
