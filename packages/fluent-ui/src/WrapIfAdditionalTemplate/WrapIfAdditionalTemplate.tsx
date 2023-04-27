import { FocusEvent } from 'react';
import { TextField } from '@fluentui/react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';

export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    disabled,
    id,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    registry,
    required,
    schema,
    style,
    uiSchema,
  } = props;
  const { templates, translateString } = registry;

  // TODO: do this better by not returning the form-group class from master.
  let { classNames = '' } = props;
  classNames = 'ms-Grid-col ms-sm12 ' + classNames.replace('form-group', '');

  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={{ ...style, marginBottom: 15 }}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);

  return (
    <div className={classNames} style={{ ...style, marginBottom: 15 }} dir='ltr'>
      <div key={`${id}-key`} className='ms-Grid-row'>
        <div className='ms-Grid-col ms-sm4 ms-md4 ms-lg5'>
          <TextField
            required={required}
            label={keyLabel}
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? handleBlur : undefined}
            type='text'
          />
        </div>
        <div className='ms-Grid-col ms-sm4 ms-md4 ms-lg5'>{children}</div>
        <div className='ms-Grid-col ms-sm4 ms-md4 ms-lg2' style={{ textAlign: 'right' }}>
          <RemoveButton
            disabled={disabled || readonly}
            onClick={onDropPropertyClick(label)}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      </div>
    </div>
  );
}
