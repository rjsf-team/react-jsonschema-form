import { useCallback } from 'react';
import type { WrapIfAdditionalTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { buttonId, ADDITIONAL_PROPERTY_FLAG, TranslatableString, getWidget } from '@rjsf/utils';

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
    children,
    classNames,
    disabled,
    id,
    label,
    displayLabel,
    readonly,
    required,
    schema,
    uiSchema,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    rawDescription,
    registry,
    propertyNamesEnum,
    ...rest
  } = props;

  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const { templates, translateString, widgets } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const marginDesc = rawDescription ? 10 : 0;
  const margin = displayLabel ? 32 + marginDesc : 10;

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
    return <div className={`flex-grow ${classNames}`}>{children}</div>;
  }

  return (
    <div className={`wrap-if-additional-template ${classNames}`} {...rest}>
      <div className='flex items-baseline' style={{ justifyContent: 'space-between' }}>
        <div>
          {displayLabel && (
            <label htmlFor={`${id}-key`} className='label'>
              <span className='label-text'>{keyLabel}</span>
            </label>
          )}
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
              type='text'
              className='input input-bordered'
              id={`${id}-key`}
              onBlur={onKeyRenameBlur}
              defaultValue={label}
              disabled={disabled || readonly}
            />
          )}
        </div>
        {children}
        <div className='flex self-start' style={{ marginTop: `${margin}px` }}>
          <RemoveButton
            id={buttonId(id, 'remove')}
            className='rjsf-object-property-remove'
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
