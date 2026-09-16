import type { WrapIfAdditionalTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { AdditionalPropertyKeySelect, buttonId, ADDITIONAL_PROPERTY_FLAG, TranslatableString } from '@rjsf/utils';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    disabled,
    id,
    label,
    keyName,
    displayLabel,
    readonly,
    required,
    schema,
    uiSchema,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    rawDescription,
    registry,
    ...rest
  } = props;

  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const marginDesc = rawDescription ? 10 : 0;
  const margin = displayLabel ? 32 + marginDesc : 10;

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
          {propertyNamesEnum ? (
            <AdditionalPropertyKeySelect<T, S, F>
              id={`${id}-key`}
              label={keyLabel}
              hideLabel
              value={keyName}
              propertyNamesEnum={propertyNamesEnum}
              onKeyRename={onKeyRename}
              disabled={disabled}
              readonly={readonly}
              required={required}
              registry={registry}
            />
          ) : (
            <input
              key={keyName}
              type='text'
              className='input input-bordered'
              id={`${id}-key`}
              onBlur={onKeyRenameBlur}
              defaultValue={keyName}
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
