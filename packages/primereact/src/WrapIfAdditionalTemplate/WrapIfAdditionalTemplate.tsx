import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, buttonId, TranslatableString, getWidget } from '@rjsf/utils';
import { InputText } from 'primereact/inputtext';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  classNames,
  style,
  children,
  disabled,
  displayLabel,
  id,
  label,
  onRemoveProperty,
  onKeyRenameBlur,
  rawDescription,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
  propertyNamesEnum,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { templates, translateString, widgets } = registry;
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const hasDescription = !!rawDescription;
  const margin = hasDescription ? -8 : 12;

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
    <div
      className={classNames}
      style={{ ...style, display: 'flex', alignItems: 'flex-start', gap: '1rem' }}
      key={`${id}-key`}
    >
      <div style={{ flex: 1 }}>
        {displayLabel && (
          <label htmlFor={`${id}-key`} style={{ display: 'block', marginBottom: '0.5rem' }}>
            {keyLabel}
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
          <InputText
            key={label}
            id={`${id}-key`}
            name={`${id}-key`}
            defaultValue={label}
            disabled={disabled || readonly}
            onBlur={!readonly ? onKeyRenameBlur : undefined}
            required={required}
            style={{ width: '100%' }}
          />
        )}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <div style={displayLabel ? { alignSelf: 'center', marginTop: `${margin}px` } : undefined}>
        <RemoveButton
          id={buttonId(id, 'remove')}
          className='rjsf-object-property-remove'
          disabled={disabled || readonly}
          onClick={onRemoveProperty}
          registry={registry}
        />
      </div>
    </div>
  );
}
