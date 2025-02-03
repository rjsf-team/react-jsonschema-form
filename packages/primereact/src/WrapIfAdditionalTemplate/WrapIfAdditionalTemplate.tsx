import { FocusEvent } from 'react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import { InputText } from 'primereact/inputtext';

export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  classNames,
  style,
  children,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
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

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);

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
          onBlur={!readonly ? handleBlur : undefined}
          required={required}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <div>
        <RemoveButton disabled={disabled || readonly} onClick={onDropPropertyClick(label)} registry={registry} />
      </div>
    </div>
  );
}
