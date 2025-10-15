import {
  ADDITIONAL_PROPERTY_FLAG,
  buttonId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
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
  id,
  label,
  onRemovePropertyClick,
  onKeyRenameBlur,
  readonly,
  required,
  schema,
  registry,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { templates, translateString } = registry;
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

  return (
    <div
      className={classNames}
      style={{ ...style, display: 'flex', alignItems: 'center', gap: '1rem' }}
      key={`${id}-key`}
    >
      <div style={{ flex: 1 }}>
        <label htmlFor={`${id}-key`} style={{ display: 'block', marginBottom: '0.5rem' }}>
          {keyLabel}
        </label>
        <InputText
          id={`${id}-key`}
          name={`${id}-key`}
          defaultValue={label}
          disabled={disabled || readonly}
          onBlur={!readonly ? onKeyRenameBlur : undefined}
          required={required}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <div>
        <RemoveButton
          id={buttonId(id, 'remove')}
          className='rjsf-object-property-remove'
          disabled={disabled || readonly}
          onClick={onRemovePropertyClick}
          registry={registry}
        />
      </div>
    </div>
  );
}
